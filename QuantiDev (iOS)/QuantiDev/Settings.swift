//
//  Settings.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 04/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

import Cereal

class Settings {
    
    private static let LoginDetailsKey = "Login Details"
    
    public struct QuantiServerLoginDetails {
        
        var username : String
        var token : String
        
        init(username: String, token: String) {
            self.username = username
            self.token = token
        }
        
        init(data: Data) {
            let decoder = try! CerealDecoder(data: data)
            
            username = try! decoder.decode(key: "username")!
            token = try! decoder.decode(key: "token")!
        }
        
        var encoded : Data? {
            get {
                var encoder = CerealEncoder()
                
                try! encoder.encode(username, forKey: "username")
                try! encoder.encode(token, forKey: "token")
                
                return encoder.toData()
            }
        }
        
    }
    
    var details : QuantiServerLoginDetails? {
        didSet {
            synchronize()
        }
    }
    
    static let sharedInstance : Settings = Settings()
    
    private init() {
        let savedDetails = UserDefaults.standard.data(forKey: Settings.LoginDetailsKey)
        
        if let d = savedDetails {
            details = QuantiServerLoginDetails(data: d)
        }
    }
    
    private func synchronize() {
        UserDefaults.standard.set(details?.encoded, forKey: Settings.LoginDetailsKey)
    }
    
}
