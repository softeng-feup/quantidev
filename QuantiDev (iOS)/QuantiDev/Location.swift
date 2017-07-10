//
//  Location.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 13/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit
import CoreLocation

import Cereal

struct Location {
    
    struct Coordinate {
        var latitude : Double
        var longitude : Double
    }
    
    var center : Coordinate
    var radius : Double
    
    var identifier : String
    
    var circularRegion : CLCircularRegion {
        get {
            return CLCircularRegion(center: CLLocationCoordinate2DMake(center.latitude, center.longitude), radius: radius, identifier: identifier)
        }
    }
    
    init(data: Data) {
        let decoder = try! CerealDecoder(data: data)
        
        center = Coordinate(latitude: try! decoder.decode(key: "latitude")!, longitude: try! decoder.decode(key: "longitude")!)
        
        radius = try! decoder.decode(key: "radius")!
        identifier = try! decoder.decode(key: "identifier")!
    }
    
    init(location: CLLocationCoordinate2D, radius: Double, identifier: String) {
        self.center = Coordinate(latitude: location.latitude, longitude: location.longitude)
        self.radius = radius
        self.identifier = identifier
    }
    
}

func == (lhs: Location, rhs: Location) -> Bool {
    return (lhs.center.latitude == rhs.center.latitude) && (lhs.center.longitude == lhs.center.longitude)
}

extension Location.Coordinate : CerealType {
    private struct Keys {
        static let latitude = "latitude"
        static let longitude = "longitude"
    }
    
    init(decoder: CerealDecoder) throws {
        latitude = try decoder.decode(key: Keys.latitude) ?? 0.0
        longitude = try decoder.decode(key: Keys.longitude) ?? 0.0
    }
    
    func encodeWithCereal(_ encoder: inout CerealEncoder) throws {
        try encoder.encode(latitude, forKey: Keys.latitude)
        try encoder.encode(longitude, forKey: Keys.longitude)
    }
}

extension Location : CerealType {
    private struct Keys {
        static let center = "center"
        static let radius = "radius"
        static let identifier = "identifier"
    }
    
    init(decoder: CerealDecoder) throws {
        center = try decoder.decodeCereal(key: Keys.center) ?? Coordinate(latitude: 0, longitude: 0)
        radius = try decoder.decode(key: Keys.radius) ?? 0.0
        identifier = try decoder.decode(key: Keys.identifier) ?? ""
    }
    
    func encodeWithCereal(_ encoder: inout CerealEncoder) throws {
        try encoder.encode(center, forKey: Keys.center)
        try encoder.encode(radius, forKey: Keys.radius)
        try encoder.encode(identifier, forKey: Keys.identifier)
    }
}
