//
//  Weather.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 05/04/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

//
//  (Manually) built from https://developer.yahoo.com/weather/documentation.html
//  Section: CONDITION CODES
//

enum Weather : Int, CustomStringConvertible, ChartableEnum {
    enum InitializationError : Error {
        case invalidRawValue
    }
    
    case tornado = 0
    case tropicalStorm = 1
    case hurricane = 2
    case severeThunderstorms = 3
    case thunderstorms = 4
    case mixedRainSnow = 5
    case mixedRainSleet = 6
    case mixedSnowSleet = 7
    case freezingDrizzle = 8
    case drizzle = 9
    case freezingRain = 10
    case showers = 11
    case showers2 = 12                  //    Duplicate Value from Yahoo!
    case snowFlurries = 13
    case lightSnowShowers = 14
    case blowingSnow = 15
    case snow = 16
    case hail = 17
    case sleet = 18
    case dust = 19
    case foggy = 20
    case haze = 21
    case smoky = 22
    case blustery = 23
    case windy = 24
    case cold = 25
    case cloudy = 26
    case mostlyCloudyNight = 27
    case mostlyCloudyDay = 28
    case partlyCloudyNight = 29
    case partlyCloudyDay = 30
    case clearNight = 31
    case sunny = 32
    case fairNight = 33
    case fairDay = 34
    case mixedRainHail = 35
    case hot = 36
    case isolatedThunderstorms = 37
    case scatteredThunderstorms = 38
    case scatteredThunderstorms2 = 39    //     Duplicate Value from Yahoo!
    case scatteredShowers = 40
    case heavySnow = 41
    case scatteredSnowShowers = 42
    case heavySnow2 = 43                 //     Duplicate Value from Yahoo!
    case partlyCloudy = 44
    case thundershowers = 45
    case snowShowers = 46
    case isolatedThundershowers = 47
    
    case notAvailable = 3200
    
    var description: String {
        switch self {
            
        case .tornado:
            return "Tornado"
        case .tropicalStorm:
            return "Tropical Storm"
        case .hurricane:
            return "Hurricane"
        case .severeThunderstorms:
            return "Severe Thunderstorms"
        case .thunderstorms:
            return "Thunderstorms"
        case .mixedRainSnow:
            return "Rain/Snow"
        case .mixedRainSleet:
            return "Rain/Sleet"
        case .freezingDrizzle:
            return "Freezing Drizzle"
        case .drizzle:
            return "Drizzle"
        case .freezingRain:
            return "Freezing Rain"
        case .showers:
            return "Showers"
        case .snowFlurries:
            return "Snow Flurries"
        case .lightSnowShowers:
            return "Light Snow Showers"
        case .blowingSnow:
            return "Blowing Snow"
        case .snow:
            return "Snow"
        case .hail:
            return "Hail"
        case .sleet:
            return "Sleet"
        case .dust:
            return "Dust"
        case .foggy:
            return "Foggy"
        case .haze:
            return "Haze"
        case .smoky:
            return "Smoky"
        case .blustery:
            return "Blustery"
        case .windy:
            return "Windy"
        case .cold:
            return "Cold"
        case .cloudy:
            return "Cloudy"
        case .mostlyCloudyNight:
            return "Mostly Cloudy"
        case .mostlyCloudyDay:
            return "Mostly Cloudy"
        case .partlyCloudyNight:
            return "Partly Cloudy"
        case .partlyCloudyDay:
            return "Partly Cloudy"
        case .clearNight:
            return "Clear"
        case .sunny:
            return "Sunny"
        case .fairNight:
            return "Fair"
        case .fairDay:
            return "Fair"
        case .mixedRainHail:
            return "Rain/Hail"
        case .hot:
            return "Hot"
        case .isolatedThunderstorms:
            return "Thunderstorms"
        case .scatteredThunderstorms:
            return "Thunderstorms"
        case .scatteredShowers:
            return "Showers"
        case .heavySnow:
            return "Heavy Snow"
        case .scatteredSnowShowers:
            return "Snow Showers"
        case .partlyCloudy:
            return "Partly Cloudy"
        case .thundershowers:
            return "Thundershowers"
        case .snowShowers:
            return "Snow Showers"
        case .isolatedThundershowers:
            return "Thundershowers"
            
        case .notAvailable:
            return "N/A"
        default:
            return "Error"
            
        }
    }
    
    var granularity: Double? {
        get {
            return 1
        }
    }
    
    var minimum: Double? {
        get {
            return 0
        }
    }
    
    var maximum : Double? {
        get {
            return 47
        }
    }
    
    init(fromRawValue: Int) throws {
        var converted = -1
        
        switch fromRawValue {
        
        case Weather.showers2.rawValue:
            converted = Weather.showers.rawValue
            
        case Weather.scatteredThunderstorms2.rawValue:
            converted = Weather.scatteredThunderstorms.rawValue
            
        case Weather.heavySnow2.rawValue:
            converted = Weather.heavySnow.rawValue
            
        default:
            converted = fromRawValue
            
        }
        
        if let s = Weather(rawValue: converted) {
            self = s
        } else {
            throw InitializationError.invalidRawValue
        }
    }
    
    func initAnother(rawValue: Any) -> ChartableEnum? {
        if let rv = rawValue as? Int {
            return Weather(rawValue: rv)
        }
        
        if let rvDouble = rawValue as? Double {
            return Weather(rawValue: Int(rvDouble))
        }
        
        return nil
    }
}
