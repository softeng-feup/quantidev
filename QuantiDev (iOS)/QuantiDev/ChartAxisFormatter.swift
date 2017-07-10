//
//  ChartAxisFormatter.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 03/04/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Charts

import UIKit

protocol SelfAwareEnum {
    func initAnother(rawValue: Any) -> ChartableEnum?
}

protocol ChartableEnum : SelfAwareEnum, CustomStringConvertible {
    var granularity : Double? { get }
    var minimum : Double? { get }
    var maximum : Double? { get }
}

class AxisFormatter : NSObject, IAxisValueFormatter {
    var granularity : Double? {
        get {
            return nil
        }
    }
    
    var minimum : Double? {
        get {
            return nil
        }
    }
    
    var maximum : Double? {
        get {
            return nil
        }
    }
    
    func stringForValue(_ value: Double, axis: AxisBase?) -> String {
        fatalError("This method must be overidden.")
    }
}

class TimeFormatter : AxisFormatter {
    
    override func stringForValue(_ value: Double, axis: AxisBase?) -> String {
        var hours = 0
        var minutes = Int(value)
        
        while minutes >= 60 {
            minutes -= 60
            hours += 1
        }
        
        return "\(hours > 9 ? String(hours) : "0" + String(hours)):\(minutes > 9 ? String(minutes) : "0" + String(minutes))"
    }
    
}


class EmojiFaceFormatter : AxisFormatter {
    
    override var granularity: Double? {
        get {
            return 1
        }
    }
    
    override var minimum : Double? {
        get {
            return 0.5
        }
    }
    
    override var maximum : Double? {
        get {
            return 5.5
        }
    }
    
    override func stringForValue(_ value: Double, axis: AxisBase?) -> String {
        if let e = Mood.MoodType(rawValue: Int(value)) {
            return e.emoji
        }
        
        return ""
    }
    
}

class BooleanFormatter : AxisFormatter {
    
    override var granularity: Double? {
        get {
            return 1
        }
    }
    
    override var minimum: Double? {
        get {
            return -0.2
        }
    }
    
    override var maximum: Double? {
        get {
            return 1.2
        }
    }
    
    override func stringForValue(_ value: Double, axis: AxisBase?) -> String {
        switch value {
        case 0:
            return "No"
            
        case 1:
            return "Yes"
            
        default:
            return ""
        }
    }
    
}

class EnumFormatter : AxisFormatter {
    
    let ceTypeInstance : ChartableEnum
    
    init(enumeration: ChartableEnum) {
        ceTypeInstance = enumeration
    }
    
    override var granularity: Double? {
        get {
            return ceTypeInstance.granularity
        }
    }
    
    override var minimum: Double? {
        get {
            return ceTypeInstance.minimum
        }
    }
    
    override var maximum: Double? {
        get {
            return ceTypeInstance.maximum
        }
    }
    
    override func stringForValue(_ value: Double, axis: AxisBase?) -> String {
        return ceTypeInstance.initAnother(rawValue: value)?.description ?? ""
    }
}
