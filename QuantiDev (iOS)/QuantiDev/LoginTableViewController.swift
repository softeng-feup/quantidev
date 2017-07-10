//
//  LoginTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 31/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import SafariServices

class LoginTableViewController: UITableViewController {
    
    @IBOutlet var usernameField : UITextField!
    @IBOutlet var passwordField : UITextField!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.navigationItem.title = "Login to QuantiDev"
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    // MARK: - Table view delegate
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        if (indexPath.section == 1) {
            guard let username = usernameField.text else {
                //  Username can't be blank.
                
                let ac = UIAlertController(title: "Error!", message: "The username field can't be left blank.", preferredStyle: .alert)
                
                ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                
                self.present(ac, animated: true, completion: nil)
                
                return
            }
            
            guard let password = passwordField.text else {
                let ac = UIAlertController(title: "Error!", message: "The password field can't be left blank.", preferredStyle: .alert)
                
                ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                
                self.present(ac, animated: true, completion: nil)
                
                return
            }
            
            QuantiServer.sharedInstance.login(username: username, password: password) {
                success, token in
                
                guard success else {
                    let ac = UIAlertController(title: "Authentication Failure!", message: "The inserted login details were not accepted by the server.", preferredStyle: .alert)
                    
                    ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                    
                    self.present(ac, animated: true, completion: nil)
                    
                    return
                }
                
                guard let t = token else {
                    //  This should not happen, but...
                    
                    let ac = UIAlertController(title: "Internal Failure!", message: "A backend error has occurred.\n\nPlease try again later.", preferredStyle: .alert)
                    
                    ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                    
                    self.present(ac, animated: true, completion: nil)
                    
                    return
                }
                
                Settings.sharedInstance.details = Settings.QuantiServerLoginDetails(username: username, token: t)
                
                self.presentingViewController?.dismiss(animated: true, completion: nil)
            }
        } else if (indexPath.section == 2) {
            let vc = SFSafariViewController(url: URL(string: QuantiServer.SignupURL)!)
            
            present(vc, animated: true, completion: nil)
        }
    }

}
