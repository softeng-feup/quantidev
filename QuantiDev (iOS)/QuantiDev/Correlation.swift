//
//  Correlation.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 20/05/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

import SigmaSwiftStatistics

typealias AnalysisDict = [ Double : [ (personal: QuantiData, work: QuantiData) ] ]

class Correlation {
    
    enum PositiveNegative {
        case positive
        case negative
    }
    
    enum Classification : String {
        case none = "no"
        case weak = "weak"
        case moderate = "moderate"
        case strong = "strong"
        
        init(pearson: Double) {
            let absPearson = abs(pearson)
            
            if absPearson < 0.1 {
                self = .none
            } else if absPearson < 0.3 {
                self = .weak
            } else if absPearson < 0.5 {
                self = .moderate
            } else {
                self = .strong
            }
        }
    }
    
    static func analyze(value: Double) -> (PositiveNegative, Classification) {
        
        let pn = value < 0 ? PositiveNegative.negative : PositiveNegative.positive
        
        let classif : Classification = Classification(pearson: abs(value))
        
        return (pn, classif)
        
    }
    
    static func analyzeEverything(interval: Interval, callback: @escaping ((AnalysisDict) -> ())) {
        var ret : AnalysisDict = [ : ]
        
        DayData.getPastDaysData(interval.days) {
            data in
            
            for personalDataType in QuantiData.personalDataTypes {
                
                if personalDataType.internalType == "weather" {
                    continue    //  Ignore weather.
                }
                
                for workDataType in QuantiData.workDataTypes {
                    var x : [Double] = []
                    var y : [Double] = []
                    
                    for (_, d) in data {
                        var personal : Double?
                        
                        if personalDataType.kind == .local {
                            if let ad = d.local[personalDataType.internalType] {
                                try? personal = ad.chartValue()
                            }
                        } else {
                            if let ad = d.remote[personalDataType.internalType] {
                                try? personal = ad.chartValue()
                            }
                        }
                        
                        var work : Double?
                        
                        if workDataType.kind == .local {
                            if let ad = d.local[workDataType.internalType] {
                                try? work = ad.chartValue()
                            }
                        } else {
                            if let ad = d.remote[workDataType.internalType] {
                                try? work = ad.chartValue()
                            }
                        }
                        
                        guard let p = personal else {
                            continue
                        }
                        
                        guard let w = work else {
                            continue
                        }
                        
                        x.append(p)
                        y.append(w)
                    }
                    
                    let pearson = Sigma.pearson(x: x, y: y)
                    
                    if let p = pearson {
                        if let a = ret[p] {
                            var modified = a
                            
                            modified.append((personalDataType, workDataType))
                            
                            ret[p] = modified
                        } else {
                            ret[p] = [( personalDataType, workDataType )]
                        }
                    }
                }
            }
            
            callback(ret)
        }
    }
    
}
