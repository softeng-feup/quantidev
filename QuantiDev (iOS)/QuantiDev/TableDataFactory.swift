//
//  TableDataFactory.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 22/05/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

struct TableDataEntry {
    var x : Double
    var y : Double
}

class TableDataFactory {
    
    static func buildData(personalData: QuantiData, workData: QuantiData, interval: Interval, callback: @escaping (_ dataEntries : [TableDataEntry], _ median: Double) -> ()) {
        DayData.getPastDaysData(interval.days) {
            data in
            
            let now = Date(timeIntervalSinceNow: 0).startOfDay
            
            var ds : [TableDataEntry] = []
            
            for i in interval.days ... 0 {
                let d = Calendar.current.date(byAdding: .day, value: i, to: now)!
                
                var personal : Double?
                
                if (personalData.kind == .local) {
                    if let d = data[d]!.local[personalData.internalType] {
                        try? personal = d.chartValue()
                    }
                } else {
                    if let d = data[d]!.remote[personalData.internalType] {
                        try? personal = d.chartValue()
                    }
                }
                
                var work : Double?
                
                if (workData.kind == .local) {
                    if let d = data[d]!.local[workData.internalType] {
                        try? work = d.chartValue()
                    }
                } else {
                    if let d = data[d]!.remote[workData.internalType] {
                        try? work = d.chartValue()
                    }
                }
                
                guard let p = personal else {
                    continue
                }
                
                guard let w = work else {
                    continue
                }
                
                ds.append(TableDataEntry(x: p, y: w))
            }
            
            //  Build median
            
            var medianCalc : (Double, Int) = (0, 0)
            
            ds.forEach {
                de in
                
                medianCalc.0 += de.y
                medianCalc.1 += 1
            }
            
            let median = medianCalc.0 / Double(medianCalc.1)
            
            //  Join everything
            
            var dict = [Int : (Double, Int)]()
            
            ds.forEach {
                de in
                
                if let val = dict[Int(de.x)] {
                    dict[Int(de.x)] = (val.0 + de.y, val.1 + 1)
                } else {
                    dict[Int(de.x)] = (de.y, 1)
                }
            }
            
            ds.removeAll()
            
            dict.forEach {
                key, value in
                
                ds.append(TableDataEntry(x: Double(key), y: value.0 / Double(value.1)))
            }
            
            //  Sort
            
            ds.sort { $0.y > $1.y }
            
            callback(ds, median)
        }
        
    }
    
}
