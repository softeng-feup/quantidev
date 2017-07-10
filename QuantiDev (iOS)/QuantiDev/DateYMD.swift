//
//  DateYMD.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 03/04/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

struct DateYMD {
    
    var year : Int
    var month : Int
    var day : Int
    
    init() {
        self.init(date: Date())
    }
    
    init(year: Int, month: Int, day: Int) {
        self.year = year
        self.month = month
        self.day = day
    }
    
    init(date: Date) {
        self.year = Calendar.current.component(.year, from: date)
        self.month = Calendar.current.component(.month, from: date)
        self.day = Calendar.current.component(.day, from: date)
    }
    
}
