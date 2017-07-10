//
//  QuantiData.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 31/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

enum QuantiDataKind : String {
    
    case local
    case remote

}

enum QuantiDataType : String {
    
    case boolean
    case unboundValues
    case specificValues
    
}

enum QuantiDataRepresentation {
    
    case chart
    case table
    
}

struct QuantiData {
    
    var name : String
    var type : QuantiDataType
    var kind : QuantiDataKind
    var internalType : String
    var axisFormatter : AxisFormatter?
    var representation : QuantiDataRepresentation?
    
    static var personalDataTypes = [
        QuantiData(name: "Exercised", type: .boolean, kind: .local, internalType: "workedOut", axisFormatter: BooleanFormatter(), representation: .chart),
        QuantiData(name: "Heart Rate", type: .unboundValues, kind: .local, internalType: "medianHeartRate", axisFormatter: nil, representation: .chart),
        QuantiData(name: "Mood", type: .specificValues, kind: .local, internalType: "mood", axisFormatter: EmojiFaceFormatter(), representation: .chart),
        QuantiData(name: "Time Asleep", type: .unboundValues, kind: .local, internalType: "timeAsleep", axisFormatter: TimeFormatter(), representation: .chart),
        QuantiData(name: "Weather Conditions", type: .specificValues, kind: .remote, internalType: "weather", axisFormatter: EnumFormatter(enumeration: Weather.notAvailable), representation: .table),
        QuantiData(name: "Hours of Work", type: .unboundValues, kind: .remote, internalType: "hoursOfWork", axisFormatter: TimeFormatter(), representation: .chart)
    ]
    
    static var workDataTypes = [
        QuantiData(name: "Commits", type: .unboundValues, kind: .remote, internalType: "commits", axisFormatter: nil, representation: nil),
        QuantiData(name: "Issues Closed", type: .unboundValues, kind: .remote, internalType: "issues", axisFormatter: nil, representation: nil),
        QuantiData(name: "Lines of Code", type: .unboundValues, kind: .remote, internalType: "linesOfCode", axisFormatter: nil, representation: nil),
        QuantiData(name: "Story Points Complete", type: .unboundValues, kind: .remote, internalType: "storyPoints", axisFormatter: nil, representation: nil)
    ]
    
}

extension QuantiData : Hashable {
    
    var hashValue : Int {
        return name.hashValue
    }
    
    static func == (lhs: QuantiData, rhs: QuantiData) -> Bool {
        return lhs.name == rhs.name
    }
    
}
