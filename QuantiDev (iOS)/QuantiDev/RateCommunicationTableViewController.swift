//
//  RateCommunicationTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 27/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import UserNotifications

class RateCommunicationTableViewController: UITableViewController {
    
    static private let CommunicationReminderNotificationIdentifier = "QDCommReminder"
    
    @IBOutlet var selectedButton : UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "Communication"
        
        updateTodayStatus()
    }
    
    func updateTodayStatus() {
        do {
            try QuantiServer.sharedInstance.getRating(date: Date()) {
                result, communication in
                
                if result {
                    if let c = communication {
                        self.selectedButton.setTitle(c.emoji, for: .normal)
                        self.selectedButton.setTitle(c.emoji, for: .highlighted)
                    }
                }
            }
        } catch _ {
            print("Not logged in!")
        }
    }
    
    @IBAction func sendRating(sender: UIButton) {
        do {
            try QuantiServer.sharedInstance.sendRating(rating: sender.tag) {
                result in
                
                if !result {
                    print("Error while sending data.")
                }
                
                self.updateTodayStatus()
            }
        } catch _ {
            print("Not authenticated!")
        }
        
        scheduleNotification()
    }
    
    func scheduleNotification() {
        //  Schedule a notification for tomorrow, same time.
        
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [RateCommunicationTableViewController.CommunicationReminderNotificationIdentifier])
        
        let content = UNMutableNotificationContent()
        
        content.title = "QuantiDev Team Communication Evaluation"
        content.body = "How would you qualify the communication with your team today?"
        
        content.sound = UNNotificationSound.default()
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: (60 * 60 * 24), repeats: false)
        
        let request = UNNotificationRequest(identifier: RateCommunicationTableViewController.CommunicationReminderNotificationIdentifier, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) {
            error in
            
            if let e = error {
                print("Error setting notification: \(e)")
            }
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

}
