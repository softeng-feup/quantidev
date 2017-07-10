//
//  DateExtension+Zelko.swift
//
//  https://stackoverflow.com/questions/13324633/nsdate-beginning-of-day-and-end-of-day
//

import Foundation

extension Date {
    var startOfDay: Date {
        return Calendar.current.startOfDay(for: self)
    }
    
    var endOfDay: Date? {
        var components = DateComponents()
        
        components.day = 1
        components.second = -1
        
        return Calendar.current.date(byAdding: components, to: startOfDay)
    }
}
