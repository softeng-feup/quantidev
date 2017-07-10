//
//  HealthKitManager.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 22/02/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import HealthKit
import HealthKitUI

class HealthKitManager {
    
    static let sharedInstance : HealthKitManager = HealthKitManager()
    
    let typesToRead = Set(arrayLiteral:
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,          //  Sleep Analysis
        HKObjectType.quantityType(forIdentifier: .heartRate)!,              //  Heart Rate
        HKObjectType.workoutType()                                          //  Exercised or not
    )
    
    let hs = HKHealthStore()
    
    var hasAuthorization : Bool = false
    
    private init() {
        
    }
    
    public func authorize(callback: @escaping (Bool) -> ()) {
        hs.requestAuthorization(toShare: nil, read: typesToRead) {
            success, error in
            self.hasAuthorization = success
            
            callback(success)
        }
    }
    
    public func getHeartRate(from: Date, to: Date, limit: Int, callback: @escaping (([Double], Error?) -> ())) {
        let datePredicate = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        let sortDescriptor = NSSortDescriptor(key:HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: HKSampleType.quantityType(forIdentifier: .heartRate)!, predicate: datePredicate, limit: limit, sortDescriptors: [sortDescriptor]) {
            query, results, error in
            
            if let e = error {
                callback([], e)
                
                return
            }
            
            var ret : [Double] = []
            
            for r in results! {
                if let result = r as? HKQuantitySample {
                    ret.append(result.quantity.doubleValue(for: HKUnit.init(from: "count/min")))
                }
            }
            
            callback(ret, nil)
        }
        
        hs.execute(query)
    }
    
    public func getHasWorkedOut(from: Date, to: Date, limit: Int, callback: @escaping ((Bool?, Error?) -> ())) {
        let datePredicate = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        let sortDescriptor =  NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: HKWorkoutType.workoutType(), predicate: datePredicate, limit: limit, sortDescriptors: [sortDescriptor]) {
            query, results, error in
            
            if let e = error {
                callback(nil, e)
                
                return
            }
            
            for r in results! {
                if let _ = r as? HKWorkout {
                    return callback(true, nil)
                }
            }
            
            callback(false, nil)
        }
        
        hs.execute(query)
    }
    
    public func getSleepSamples(from: Date, to: Date, limit: Int, callback: @escaping (([HKCategorySample], Error?) -> ())) {
        let datePredicate = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        let sortDescriptor =  NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!, predicate: datePredicate, limit: limit, sortDescriptors: [sortDescriptor]) {
            query, results, error in
            
            if let e = error {
                callback([], e)
                
                return
            }
            
            var samples : [HKCategorySample] = []
            
            for r in results! {
                if let sample = r as? HKCategorySample {
                    samples.append(sample)
                }
            }
            
            callback(samples, nil)
        }
        
        hs.execute(query)
    }
    
    public func getMenstruationStatus(from: Date, to: Date, limit: Int, callback: @escaping ((Bool?, Error?) -> ())) {
        let datePredicate = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        let sortDescriptor =  NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: HKObjectType.categoryType(forIdentifier: .menstrualFlow)!, predicate: datePredicate, limit: limit, sortDescriptors: [sortDescriptor]) {
            query, results, error in
            
            if let e = error {
                callback(nil, e)
                
                return
            }
            
            for r in results! {
                if let _ = r as? HKCategorySample {
                    callback(true, nil)
                }
            }
            
            callback(false, nil)
        }
        
        hs.execute(query)
    }
    
}
