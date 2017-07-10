//
//  ChartDataFactory.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 09/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Charts

import UIKit

enum Interval : Int {
    case lastWeek = 0
    case lastMonth = 1
    case lastThreeMonths = 2
    case lastSixMonths = 3
    case lastYear = 4
    
    var days : Int {
        get {
            switch self {
                
            case .lastWeek:
                return -7
                
            case .lastMonth:
                return -30
                
            case .lastThreeMonths:
                return -90
                
            case .lastSixMonths:
                return -180
                
            case .lastYear:
                return -360
                
            }
        }
    }
}


class ChartDataFactory {
    
    static func buildData(personalData: QuantiData, workData: QuantiData, interval: Interval, callback: @escaping (_ dataEntries : [ChartDataEntry], _ medianEntries: [ChartDataEntry], _ attribution: Bool, _ xDelegate: AxisFormatter?, _ yDelegate: AxisFormatter?) -> ()) {
        DayData.getPastDaysData(interval.days) {
            data in
            
            let now = Date(timeIntervalSinceNow: 0).startOfDay
            
            var ds : [ChartDataEntry] = []
            
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
                
                ds.append(ChartDataEntry(x: p, y: w))
            }
            
            //  Build median!
            
            var medTupleDict : [Double : (ySum: Double, entries: Int)] = [:];   //  (x => ySum, entryCount)
            
            for entry in ds {
                if var existingEntry = medTupleDict[entry.x] {
                    existingEntry.ySum += entry.y
                    existingEntry.entries += 1
                    
                    medTupleDict[entry.x] = existingEntry
                } else {
                    medTupleDict[entry.x] = (ySum: entry.y, entries: 1)
                }
            }
            
            var medEntries : [ChartDataEntry] = []
            
            let sortedKeys = medTupleDict.keys.sorted()
            
            for x in sortedKeys {
                let tuple = medTupleDict[x]!
                
                medEntries.append(ChartDataEntry(x: x, y: tuple.ySum / Double(tuple.entries)))
            }
            
            let requiresAttribution = false
            
            callback(ds, medEntries, requiresAttribution, personalData.axisFormatter, workData.axisFormatter)
        }
        
    }
    
}
