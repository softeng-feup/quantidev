//
//  ChartTranslatable.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 03/04/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

protocol ChartTranslatableProtocol {
    func chartValue() throws -> Double
}

struct ChartTranslatable<Element> : ChartTranslatableProtocol {
    
    enum ConversionError : Error {
        case invalidValue
        case invalidType
    }
    
    enum Axis {
        case x
        case y
    }
    
    var value : Element
    
    init(_ element: Element) {
        value = element
    }
    
    func chartValue() throws -> Double {
        if let v = value as? Bool {
            return (v ? 1 : 0)
        }
        
        if let v = value as? Int {
            if v == 0 {
                throw ConversionError.invalidValue
            }
            
            return Double(v)
        }
        
        if let v = value as? Double {
            if v < 0.01 {
                throw ConversionError.invalidValue
            }
            
            return v
        }
        
        if let v = value as? Mood.MoodType {
            return Double(v.rawValue)
        }
        
        if let v = value as? Weather {
            if v == .notAvailable {
                throw ConversionError.invalidValue
            }
            
            return Double(v.rawValue)
        }
        
        throw ConversionError.invalidType
    }
    
}
