//
//  Location.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 13/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit
import CoreLocation
import UserNotifications

import Cereal

class LocationManager : NSObject {
    
    static let sharedInstance = LocationManager()
    
    private let locationManager = CLLocationManager()
    
    private static let LocationsKey = "Location Manager - Locations"
    
    private var running : Bool = false
    
    var locations : [Location] = [] {
        didSet {
            synchronize()
            
            if running {
                stop()
                start()
            }
        }
    }
    
    var encoded : Data? {
        get {
            return try! CerealEncoder.data(withRootItem: locations)
        }
    }
    
    override private init() {
        super.init()
        
        locationManager.delegate = self
        
        load()
    }
    
    func load() {
        let data = UserDefaults.standard.data(forKey: LocationManager.LocationsKey)
        
        if let d = data {
            locations = try! CerealDecoder.rootCerealItems(with: d)
        }
    }
    
    func start() {
        locationManager.requestAlwaysAuthorization()
        
        if !CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) {
            return
        }
        
        if CLLocationManager.authorizationStatus() != .authorizedAlways {
            return
        }
        
        for l in locations {
            locationManager.startMonitoring(for: l.circularRegion)
        }
        
        running = true
    }
    
    func stop() {
        for l in locations {
            locationManager.stopMonitoring(for: l.circularRegion)
        }
        
        running = false
    }
    
    func add(location: Location) {
        locations.append(location)
    }
    
    func add(location: CLLocationCoordinate2D) {
        locations.append(Location(location: location, radius: 200, identifier: ""))
    }
    
    func add(location: CLLocationCoordinate2D, identifier: String) {
        locations.append(Location(location: location, radius: 200, identifier: identifier))
    }
    
    func remove(location: Location) -> Bool {
        for x in 0 ... locations.count - 1 {
            if locations[x] == location {
                locations.remove(at: x)
                
                return true
            }
        }
        
        return false
    }
    
    func location(identifier: String) -> Location? {
        for l in locations {
            if l.identifier == identifier {
                return l
            }
        }
        
        return nil
    }
    
    private func synchronize() {
        UserDefaults.standard.set(encoded, forKey: LocationManager.LocationsKey)
    }
}

extension LocationManager : CLLocationManagerDelegate  {
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        //  Authorized!
    }
    
    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        //  Entered region!
        
        print("Entered work region.")
        
        try? QuantiServer.sharedInstance.startWorking(location: location(identifier: region.identifier)!) {
            success in
            
            if success {
                triggerLocalNotification(identifier: "EnteredWorkRegion", title: "Entered Workplace!", message: "You are in range of your workplace. Your work status was automatically toggled.")
            } else {
                triggerLocalNotification(identifier: "EnteredWorkRegionFailed", title: "Entered Workplace!", message: "You are in range of your workplace, but the work status was NOT automatically toggled because of an error.")
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
        //  Exited region!
        
        try? QuantiServer.sharedInstance.stopWorking {
            success in
            
            if success {
                triggerLocalNotification(identifier: "LeftWorkRegion", title: "Left Workplace!", message: "You are out of range of your workplace. Your work status was automatically toggled.")
            } else {
                triggerLocalNotification(identifier: "LeftWorkRegionFailed", title: "Left Workplace!", message: "You are out of range of your workplace, but the work status was NOT automatically toggled because of an error.")
            }
        }
    }
    
}
