//
//  MoodTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 03/04/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import Realm
import RealmSwift

class MoodTableViewController: UITableViewController {
    
    let now = DateYMD()
    
    @IBOutlet var selectedButton : UIButton!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "Mood"
        
        updateTodayStatus()
    }
    
    func updateTodayStatus() {
        if let m = Mood.get(date: now) {
            self.selectedButton.setTitle(m.type.emoji, for: .normal)
            self.selectedButton.setTitle(m.type.emoji, for: .highlighted)
        }
    }
    
    @IBAction func setRating(sender: UIButton) {
        let realm = try! Realm()
        let rating = Mood.MoodType(rawValue: sender.tag)!
        
        if let m = Mood.get(date: now) {
            try! realm.write {
                m.type = rating
            }
        } else {
            let m = Mood.create(date: now, type: rating)
            
            try! realm.write {
                realm.add(m)
            }
        }
        
        self.selectedButton.setTitle(rating.emoji, for: .normal)
        self.selectedButton.setTitle(rating.emoji, for: .highlighted)
    }
    
    func scheduleNotification() {
        
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

}
