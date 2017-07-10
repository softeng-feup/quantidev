//
//  RemoteData.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 04/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

struct RemoteData {
    
    enum Kind : String {
        case linesOfCode = "LinesOfCode"
        case storyPoints = "StoryPoints"
        case issues = "Issues"
        case hoursOfWork = "HoursOfWork"
        case weather = "Weather"
    }
    
}
