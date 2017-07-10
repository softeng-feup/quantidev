//
//  MainTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 31/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import SafariServices

import EZLoadingActivity

class MainTableViewController: UITableViewController {
    
    var inTeam : Bool = false

    override func viewDidLoad() {
        super.viewDidLoad()
        
        if !QuantiServer.sharedInstance.authenticated {
            presentLoginScreen()
        }
        
        LocationManager.sharedInstance.start()
        
        HealthKitManager.sharedInstance.authorize() {
            _ in
        }
    }
    
    func presentLoginScreen() {
        let loginStoryboard = UIStoryboard(name: "Login", bundle: nil)
        
        let mvc = loginStoryboard.instantiateInitialViewController()!
        
        self.navigationController?.present(mvc, animated: true, completion: nil)
    }
    
    @IBAction func logOutTapped() {
        let ac = UIAlertController(title: "Log Out?", message: "Are you sure you want to log out?", preferredStyle: .alert)
        
        ac.addAction(
            UIAlertAction(title: "Log Out", style: .default) { _ in
                Settings.sharedInstance.details = nil
                
                self.presentLoginScreen()
            }
        )
        
        ac.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        self.present(ac, animated: true, completion: nil)
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    // MARK: - Table view delegate
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        if indexPath.section == 0 {
            do {
                try QuantiServer.sharedInstance.containedInTeam {
                    hasTeam in
                    
                    if hasTeam {
                        if indexPath.row == 0 {
                            self.performSegue(withIdentifier: "showGeolocation", sender: self)
                        } else if indexPath.row == 1 {
                            self.performSegue(withIdentifier: "showTeamCommunication", sender: self)
                        }
                    } else {
                        let ac = UIAlertController(title: "Error!", message: "You must be contained in a team in order to access this functionality.", preferredStyle: .alert)
                        
                        ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                        
                        self.present(ac, animated: true, completion: nil)
                        
                        tableView.deselectRow(at: tableView.indexPathForSelectedRow!, animated: true)
                    }
                }
            } catch {
                let ac = UIAlertController(title: "Error!", message: "An error has occured while contacting quantiserver.", preferredStyle: .alert)
                
                ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                
                self.present(ac, animated: true, completion: nil)
                
                tableView.deselectRow(at: tableView.indexPathForSelectedRow!, animated: true)
            }
        } else if indexPath.section == 1 {
            if indexPath.row == 2 {
                let _ = EZLoadingActivity.show("Analyzing...", disableUI: true)
                
                Correlation.analyzeEverything(interval: Interval.lastSixMonths) {
                    data in
                    
                    DispatchQueue.main.async {
                        tableView.deselectRow(at: tableView.indexPathForSelectedRow!, animated: true)
                        
                        let _ = EZLoadingActivity.hide()
                        
                        self.performSegue(withIdentifier: "showDataAnalysis", sender: data)
                    }
                }
            }
        } else if indexPath.section == 2 {
            let vc = SFSafariViewController(url: URL(string: QuantiServer.sharedInstance.webServicesURL)!)
            
            present(vc, animated: true, completion: nil)
        }
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "showDataAnalysis" {
            if let da = segue.destination as? DataAnalysisTableViewController {
                if let ar = sender as? AnalysisDict {
                    da.analysisResult = ar
                }
            }
        }
    }

}
