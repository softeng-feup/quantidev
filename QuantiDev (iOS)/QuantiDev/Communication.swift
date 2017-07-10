//
//  Communication.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 27/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

enum Communication : Int {
    
    case 😟 = 1
    case 🙁 = 2
    case 😶 = 3
    case 😀 = 4
    case 😁 = 5
    
    var emoji : String {
        switch self {
        case Communication.😟:
            return "😟"
            
        case Communication.🙁:
            return "🙁"
            
        case Communication.😶:
            return "😶"
            
        case Communication.😀:
            return "😀"
            
        case Communication.😁:
            return "😁"
        }
    }

}
