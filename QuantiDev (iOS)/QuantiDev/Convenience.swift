//
//  Convenience.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 06/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import Foundation

import UserNotifications

func secondsToHoursMinutesSeconds (seconds : Int) -> (Int, Int, Int) {
    return (seconds / 3600, (seconds % 3600) / 60, (seconds % 3600) % 60)
}

func triggerLocalNotification(identifier: String, title: String, message: String) {
    let content = UNMutableNotificationContent()
    
    content.title = title
    content.body = message
    
    content.sound = UNNotificationSound.default()
    
    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0, repeats: false)
    
    let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
    
    UNUserNotificationCenter.current().add(request) {
        error in
        
    }
}
