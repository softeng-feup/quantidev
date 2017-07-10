//
//  Mood.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 08/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

import Realm
import RealmSwift

class Mood : Object {
    
    enum MoodType : Int {
        
        case 😟 = 1
        case 🙁 = 2
        case 😶 = 3
        case 😀 = 4
        case 😁 = 5
        
        var emoji : String {
            switch self {
            case MoodType.😟:
                return "😟"
                
            case MoodType.🙁:
                return "🙁"
                
            case MoodType.😶:
                return "😶"
                
            case MoodType.😀:
                return "😀"
                
            case MoodType.😁:
                return "😁"
            }
        }
        
    }
    
    dynamic private var moodInternal : Int = 0
    
    dynamic private var year : Int = 0
    dynamic private var month : Int = 0
    dynamic private var day : Int = 0
    
    var date : DateYMD {
        get {
            return DateYMD(year: year, month: month, day: day)
        }
        
        set {
            self.year = newValue.year
            self.month = newValue.month
            self.day = newValue.day
        }
    }
    
    var type : MoodType {
        get {
            return MoodType(rawValue: moodInternal)!
        }
        
        set {
            moodInternal = newValue.rawValue
        }
    }
    
    static func create(date: DateYMD, type: MoodType) -> Mood {
        let mood = Mood()
        
        mood.date = date
        mood.type = type
        
        return mood
    }
    
    static func get(date: DateYMD) -> Mood? {
        let realm = try! Realm()
        
        let r = realm.objects(Mood.self).filter("year = \(date.year) AND month = \(date.month) AND day = \(date.day)");
        
        if r.count == 0 {
            return nil
        }
        
        return r[0]
    }
    
    static func get(swiftDate: Date) -> Mood? {
        return get(date: DateYMD(date: swiftDate))
    }
    
}

