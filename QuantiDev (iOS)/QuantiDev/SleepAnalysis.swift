//
//  SleepAnalysis.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 06/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

class SleepAnalysis {
    
    let hkm : HealthKitManager
    
    init(hkManager: HealthKitManager) {
        hkm = hkManager
    }
    
    public func getWakeUpTime(from: Date, to: Date, callback: @escaping ((Date?, Error?) -> ())) {
        hkm.getSleepSamples(from: from, to: to, limit: Constants.NoLimit) {
            samples, error in
            
            if let e = error {
                return callback(nil, e)
            }
            
            for s in samples {
                return callback(s.endDate, nil)
            }
            
            return callback(nil, nil)
        }
    }
    
    public func getTimeAsleep(from: Date, to: Date, callback: @escaping (Double?, Error?) -> ()) {
        hkm.getSleepSamples(from: from, to: to, limit: Constants.NoLimit) {
            samples, error in
            
            if let e = error {
                return callback(nil, e)
            }
            
            var timeAsleep : Double = 0.0
            
            for s in samples {
                timeAsleep += s.endDate.timeIntervalSince1970 - s.startDate.timeIntervalSince1970
            }
            
            callback(timeAsleep, error)
        }
    }
    
}
