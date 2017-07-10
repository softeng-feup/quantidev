//
//  ViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 07/02/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

class ViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        if !QuantiServer.sharedInstance.authenticated {
            let loginStoryboard = UIStoryboard(name: "Login", bundle: nil)
            
            let mvc = loginStoryboard.instantiateInitialViewController()!
            
            self.navigationController?.present(mvc, animated: true, completion: nil)
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

}

