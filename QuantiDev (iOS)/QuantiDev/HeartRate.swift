//
//  HeartRate.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 03/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

class HeartRate {
    
    let hkm : HealthKitManager
    
    init(hkManager: HealthKitManager) {
        hkm = hkManager
    }
    
    public func getHeartRateData(from: Date, to: Date, callback: @escaping ([Double]) -> ()) {
        hkm.getHeartRate(from: from, to: to, limit: Constants.NoLimit) {
            results, error in
            callback(results)
        }
    }
    
    public func getHeartRateData(day: Date, callback: @escaping ([Double]) -> ()) {
        getHeartRateData(from: day.startOfDay, to: day.endOfDay!, callback: callback)
    }
    
    public func getMedianHeartRate(day: Date, callback: @escaping (Double?) -> ()) {
        hkm.getHeartRate(from: day.startOfDay, to: day.endOfDay!, limit: Constants.NoLimit) {
            results, error in
            if error != nil {
                callback(nil)
            }
            
            if results.count > 0 {
                callback(results.reduce(0, +) / Double(results.count))
            } else {
                callback(nil)
            }
        }
    }
    
    public func getMostRecentHeartRate(callback: @escaping (Double?) -> ()) {
        let past = NSDate.distantPast as Date
        let now = NSDate() as Date
        
        hkm.getHeartRate(from: past, to: now, limit: 1) {
            results, error in
            if results.count > 0 {
                callback(results[0]);
            } else {
                callback(nil);
            }
        }
    }
    
}
