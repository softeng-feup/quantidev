//
//  AppDelegate.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 07/02/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import UserNotifications

@UIApplicationMain

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        UNUserNotificationCenter.current().requestAuthorization(options: [ .alert, .sound ]) {
            granted, error in
            
        }
        
        return true
    }

}

