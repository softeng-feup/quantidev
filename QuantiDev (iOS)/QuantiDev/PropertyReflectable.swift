//
//  PropertyReflectable.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 09/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

protocol PropertyReflectable { }

extension PropertyReflectable {
    
    subscript(key: String) -> Any? {
        let m = Mirror(reflecting: self)
        
        for child in m.children {
            if child.label == key {
                return child.value
            }
        }
        
        return nil
    }
    
}
