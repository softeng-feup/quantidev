//
//  QuantiServer.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 02/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Alamofire

class QuantiServer {
    
    static private let ServerURL = ""
    static private let QuantiWebURL = ""
    
    static private var BaseURL : String {
        get {
            return ServerURL + "api/"
        }
    }
    
    static var SignupURL : String {
        get {
            return QuantiWebURL + "signup"
        }
    }
    
    enum QuantiServerError : Error {
        case notAuthenticated
    }
    
    static let sharedInstance : QuantiServer = QuantiServer()
    
    private var username : String?
    private var password : String?
    
    private var token : String?
    
    var authenticated : Bool {
        get {
            return token != nil
        }
    }
    
    var webServicesURL : String {
        get {
            if let u = username {
                if let t = token {
                    return QuantiServer.QuantiWebURL + "mobile/login?username=" + u + "&token=" + t
                }
            }
            
            return QuantiServer.QuantiWebURL
        }
    }
    
    private init() {
        if let d = Settings.sharedInstance.details {
            set(username: d.username, token: d.token)
        }
    }
    
    func set(username: String, token: String) {
        self.username = username
        self.token = token
    }
    
    private var headers : HTTPHeaders? {
        if let u = username {
            if let tok = token {
                return [ "Authorization" : "QD-TOKEN " + u + ";" + tok ]
            }
        }
        
        return nil;
    }
    
    private func buildURI(route: String) -> URLConvertible {
        return QuantiServer.BaseURL.appending(route)
    }
    
    func login(username: String, password: String, callback: @escaping (Bool, String?) -> ()) {
        self.username = username
        self.password = password
        
        let params : Parameters = [
            "username": username,
            "password": password
        ]
        
        Alamofire.request(buildURI(route: "login"), parameters: params).responseJSON { response in
            if let JSON = response.result.value {
                let parsed = JSON as! NSDictionary
                
                if let tok = parsed.object(forKey: "token") as? String {
                    self.token = tok
                    
                    callback(true, tok)
                }
            } else {
                callback(false, nil)
            }
        }
    }
    
    func toggleWorking(callback: @escaping (Bool) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        Alamofire.request(buildURI(route: "log"), method: .post, parameters: ["class": "worklog"], headers: headers).responseJSON { response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let b = parsed.object(forKey: "success") as? Bool {
                        return callback(b)
                    }
                }
            }
            
            callback(false)
        }
    }
    
    func toggleWorking(location: Location, callback: @escaping (Bool) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        let params = [
            "class": "worklog",
            "location": [
                "latitude": location.center.latitude,
                "longitude": location.center.longitude
            ]
        ] as [String : Any]
        
        Alamofire.request(buildURI(route: "log"), method: .post, parameters: params, headers: headers).responseJSON { response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let b = parsed.object(forKey: "success") as? Bool {
                        return callback(b)
                    }
                }
            }
            
            callback(false)
        }
    }
    
    func startWorking(location: Location, callback: @escaping (Bool) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        let params = [
            "latitude": location.center.latitude,
            "longitude": location.center.longitude
        ] as [String : Any]
        
        Alamofire.request(buildURI(route: "log/enter"), method: .post, parameters: params, headers: headers).responseJSON {
            response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let b = parsed.object(forKey: "success") as? Bool {
                        return callback(b)
                    }
                }
            }
            
            callback(false)
        }
    }
    
    func stopWorking(callback: @escaping(Bool) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        Alamofire.request(buildURI(route: "log/leave"), method: .post, headers: headers).responseJSON { response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let b = parsed.object(forKey: "success") as? Bool {
                        return callback(b)
                    }
                }
            }
            
            callback(false)
        }
    }
    
    private func parseDataDict(data: NSDictionary) -> [ RemoteData.Kind : Any ] {
        var weather : Weather? = nil
        
        if let w = data.object(forKey: RemoteData.Kind.weather.rawValue) as? Int {
            do {
                weather = try Weather(fromRawValue: w)
            } catch _ {
                print("Error converting weather...")
            }
        }
        
        let dict : [ RemoteData.Kind : Any ] = [
            .linesOfCode    : data.object(forKey: RemoteData.Kind.linesOfCode.rawValue) ?? 0,
            .storyPoints    : data.object(forKey: RemoteData.Kind.storyPoints.rawValue) ?? 0,
            .issues         : data.object(forKey: RemoteData.Kind.issues.rawValue) ?? 0,
            .hoursOfWork    : data.object(forKey: RemoteData.Kind.hoursOfWork.rawValue) ?? 0.00,
            .weather        : weather ?? Weather.notAvailable
        ]
        
        return dict
    }
    
    func getData(date: Date, callback: @escaping (Bool, [ RemoteData.Kind : Any ]) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        let year = Calendar.current.component(.year, from: date)
        let month = Calendar.current.component(.month, from: date)
        let day = Calendar.current.component(.day, from: date)
        
        Alamofire.request(buildURI(route: "data/\(year)/\(month)/\(day)"), method: .get, headers: headers).responseJSON {
            response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let success = parsed.object(forKey: "success") as? Bool {
                        if success, let data = parsed.object(forKey: "data") as? NSDictionary {
                            return callback(true, self.parseDataDict(data: data))
                        }
                    }
                }
            }
            
            callback(false, [:])
        }
    }
    
    func getTodayData(callback: @escaping (Bool, [ RemoteData.Kind : Any ]) -> ()) throws {
        try getData(date: Date.init(timeIntervalSinceNow: 0), callback: callback)
    }
    
    func getDataSince(date: Date, callback: @escaping (Bool, [ Date : [ RemoteData.Kind : Any ] ]) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        let year = Calendar.current.component(.year, from: date)
        let month = Calendar.current.component(.month, from: date)
        let day = Calendar.current.component(.day, from: date)
        
        Alamofire.request(buildURI(route: "data/since/\(year)/\(month)/\(day)"), method: .get, headers: headers).responseJSON {
            response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let success = parsed.object(forKey: "success") as? Bool {
                        if success, let d = parsed.object(forKey: "data") as? NSDictionary {
                            let dateFormatter = DateFormatter()
                            dateFormatter.dateFormat = "yyyy/MM/dd"
                            
                            var ret : [ Date : [ RemoteData.Kind : Any ] ] = [:]
                            
                            for (date, data) in d {
                                if let pd = dateFormatter.date(from: date as? String ?? "") {
                                    ret[pd] = self.parseDataDict(data: data as? NSDictionary ?? [:])
                                }
                            }
                            
                            return callback(true, ret)
                        }
                    }
                }
            }
            
            callback(false, [:])
        }
    }
    
    func sendRating(rating: Int, callback: @escaping (Bool) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        let params = [
            "class": "communication",
            "rating": rating
        ] as [String : Any]
        
        Alamofire.request(buildURI(route: "log"), method: .post, parameters: params, headers: headers).responseJSON {
            response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let b = parsed.object(forKey: "success") as? Bool {
                        return callback(b)
                    }
                }
            }
            
            return callback(false)
        }
    }
    
    func getRating(date: Date, callback: @escaping (Bool, Communication?) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        let year = Calendar.current.component(.year, from: date)
        let month = Calendar.current.component(.month, from: date)
        let day = Calendar.current.component(.day, from: date)
        
        Alamofire.request(buildURI(route: "log/communication/\(year)/\(month)/\(day)"), method: .get, headers: headers).responseJSON {
            response in
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let _ = parsed.object(forKey: "success") as? Bool {
                        if let r = parsed.object(forKey: "rating") as? Int {
                            let c = Communication(rawValue: r)!
                            
                            return callback(true, c)
                        }
                        
                        return callback(true, nil)
                    }
                }
            }
            
            return callback(false, nil)
        }
    }
    
    func containedInTeam(callback: @escaping(Bool) -> ()) throws {
        if !authenticated {
            throw QuantiServerError.notAuthenticated
        }
        
        Alamofire.request(buildURI(route: "team"), method: .get, headers: headers).responseJSON {
            response in
            
            if let JSON = response.result.value {
                if let parsed = JSON as? NSDictionary {
                    if let ret = parsed.object(forKey: "success") as? Bool {
                        return callback(ret);
                    }
                }
            }
            
            return callback(false);
        }
    }
    
}
