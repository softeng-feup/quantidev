//
//  DayData.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 06/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

protocol DayDataType {
    subscript(key: String) -> ChartTranslatableProtocol? { get }
    
    func get(type: String) -> ChartTranslatableProtocol?
}

class DayData {
    
    private static let MaxWakeUpTime : TimeInterval = 54_000       //  15:00
    
    struct Local : DayDataType {
        static let FieldCount = 6
        
        enum Field : String {
            case medianHeartRate = "medianHeartRate"
            case workedOut = "workedOut"
            case timeAsleep = "timeAsleep"
            case wakeUpTime = "wakeUpTime"
            case menstruationStatus = "menstruationStatus"
            case mood = "mood"
            
            func description() -> String {
                switch self {
                    
                case .medianHeartRate:
                    return "Median Heart Rate"
                    
                case .workedOut:
                    return "Worked Out"
                    
                case .timeAsleep:
                    return "Time Asleep"
                    
                case .wakeUpTime:
                    return "Wake Up Time"
                    
                case .menstruationStatus:
                    return "Menstruation Status"
                    
                case .mood:
                    return "Mood"
                    
                }
                
            }
            
            var count : Int {
                get {
                    return Local.FieldCount
                }
            }
        }
        
        var medianHeartRate : ChartTranslatable<Double>?
        var workedOut : ChartTranslatable<Bool>?
        var timeAsleep : ChartTranslatable<Double>?
        var wakeUpTime : ChartTranslatable<Date>?
        var menstruationStatus : ChartTranslatable<Bool>?
        var mood : ChartTranslatable<Mood.MoodType>?
        
        init() {
            
        }
        
        subscript(key: String) -> ChartTranslatableProtocol? {
            return get(type: key)
        }
        
        func get(type: String) -> ChartTranslatableProtocol? {
            if type == "medianHeartRate" {
                return medianHeartRate
            }
            
            if type == "workedOut" {
                return workedOut
            }
            
            if type == "timeAsleep" {
                return timeAsleep
            }
            
            if type == "wakeUpTime" {
                return wakeUpTime
            }
            
            if type == "menstruationStatus" {
                return menstruationStatus
            }
            
            if type == "mood" {
                return mood
            }
            
            return nil
        }
    }
    
    struct Remote : DayDataType {
        enum Field : String {
            case linesOfCode = "linesOfCode"
            case storyPoints = "storyPoints"
            case issues = "issues"
            case hoursOfWork = "hoursOfWork"
            case weather = "weather"
            
            func description() -> String {
                switch self {
                    
                case .linesOfCode:
                    return "Lines of Code"
                    
                case .storyPoints:
                    return "Story Points"
                    
                case .issues:
                    return "Issues"
                    
                case .hoursOfWork:
                    return "Hours of Work"
                    
                case .weather:
                    return "Weather Conditions"
                    
                }
            }
            
            var count : Int {
                get {
                    return 5
                }
            }
        }
        
        var linesOfCode : ChartTranslatable<Int>?
        var storyPoints : ChartTranslatable<Int>?
        var issues : ChartTranslatable<Int>?
        var hoursOfWork : ChartTranslatable<Double>?
        var weather : ChartTranslatable<Weather>?
        
        init() {
            
        }
        
        init(data: [RemoteData.Kind : Any]) {
            if let loc = data[.linesOfCode] as? Double {
                linesOfCode = ChartTranslatable<Int>(Int(loc))
            }
            
            if let sp = data[.storyPoints] as? Double {
                storyPoints = ChartTranslatable<Int>(Int(sp))
            }
            
            if let i = data[.issues] as? Double {
                issues = ChartTranslatable<Int>(Int(i))
            }
            
            if let how = data[.hoursOfWork] as? Double {
                hoursOfWork = ChartTranslatable<Double>(how)
            }
            
            if let w = data[.weather] as? Weather {
                if w != .notAvailable {
                    weather = ChartTranslatable<Weather>(w)
                }
            }
        }
        
        subscript(key: String) -> ChartTranslatableProtocol? {
            return get(type: key)
        }
        
        func get(type: String) -> ChartTranslatableProtocol? {
            if type == "linesOfCode" {
                return linesOfCode
            }
            
            if type == "storyPoints" {
                return storyPoints
            }
            
            if type == "issues" {
                return issues
            }
            
            if type == "hoursOfWork" {
                return hoursOfWork
            }
            
            if type == "weather" {
                return weather
            }
            
            return nil
        }
    }
    
    let day : Date
    
    var local = Local()
    var remote = Remote()
    
    init(day: Date) {
        self.day = day
    }
    
    private func clearCache() {
        self.local = Local()
        self.remote = Remote()
    }
    
    private func attemptGetDataReturn(count: Int, errored: Bool, callback: (Bool) -> ()) {
        if count == 0 {
            callback(!errored)
        }
    }
    
    func getData(connection: QuantiServer?, callback: @escaping (Bool) -> ()) throws {
        var errored = false
        var count = Local.FieldCount;
        
        clearCache()
        
        if let qs = connection {
            if qs.authenticated {
                count += 1
                
                try qs.getData(date: day) {
                    dataSuccess, data in
                    
                    if dataSuccess {
                        self.remote = Remote(data: data)
                    } else {
                        errored = true
                    }
                    
                    count -= 1
                    
                    self.attemptGetDataReturn(count: count, errored: errored, callback: callback)
                }
            }
        }
        
        let hr = HeartRate(hkManager: HealthKitManager.sharedInstance)
        
        hr.getMedianHeartRate(day: day) {
            result in
            
            if let rate = result {
                self.local.medianHeartRate = ChartTranslatable<Double>(rate)
            } else {
                errored = true
            }
            
            count -= 1;
            
            self.attemptGetDataReturn(count: count, errored: errored, callback: callback)
        }
        
        HealthKitManager.sharedInstance.getHasWorkedOut(from: day.startOfDay, to: day.endOfDay!, limit: 1) {
            wo, error in
            
            if error != nil {
                errored = true
            } else {
                if let w = wo {
                    self.local.workedOut = ChartTranslatable<Bool>(w)
                } else {
                    errored = true
                }
            }
            
            count -= 1;
            
            self.attemptGetDataReturn(count: count, errored: errored, callback: callback)
        }
        
        HealthKitManager.sharedInstance.getMenstruationStatus(from: day.startOfDay, to: day.endOfDay!, limit: 1) {
            ms, error in
            
            if error != nil {
                errored = true
            } else {
                if let status = ms {
                    self.local.menstruationStatus = ChartTranslatable<Bool>(status)
                } else {
                    errored = true
                }
            }
            
            count -= 1;
            
            self.attemptGetDataReturn(count: count, errored: errored, callback: callback)
        }
        
        let sa = SleepAnalysis(hkManager: HealthKitManager.sharedInstance)
        
        sa.getTimeAsleep(from: day.startOfDay, to: day.startOfDay.addingTimeInterval(DayData.MaxWakeUpTime)) {
            time, error in
            
            if error != nil {
                errored = true
            } else {
                if let t = time {
                    self.local.timeAsleep = ChartTranslatable<Double>(t)
                }
            }
            
            count -= 1;
            
            self.attemptGetDataReturn(count: count, errored: errored, callback: callback)

        }
        
        sa.getWakeUpTime(from: day.startOfDay, to: day.startOfDay.addingTimeInterval(DayData.MaxWakeUpTime)) {
            date, error in
            
            if let _ = error {
                errored = true
            } else {
                if let d = date {
                    self.local.wakeUpTime = ChartTranslatable<Date>(d)
                }
            }
            
            count -= 1;
            
            self.attemptGetDataReturn(count: count, errored: errored, callback: callback)

        }
        
        if let m = Mood.get(swiftDate: day) {
            self.local.mood = ChartTranslatable<Mood.MoodType>(m.type)
        } else {
            errored = true
        }
        
        count -= 1;
        
        self.attemptGetDataReturn(count: count, errored: errored, callback: callback)
    }
    
    static func getPastDaysData(_ daysUpToToday: Int, callback: @escaping([Date : DayData]) -> ()) {
        let now = Date(timeIntervalSinceNow: 0).startOfDay
        
        var days : [Date : DayData] = [:]
        
        for i in daysUpToToday ... 0 {
            let day = Calendar.current.date(byAdding: .day, value: i, to: now)!
            
            let dd = DayData(day: day)
            
            do {
                try dd.getData(connection: QuantiServer.sharedInstance) {
                    success in
                    
                    days[day] = dd
                    
                    if days.count == abs(daysUpToToday) + 1 {
                        callback(days)
                    }
                }
            } catch _ {
                print("Exception!")
            }
        }
    }
    
}
