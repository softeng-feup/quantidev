//
//  DataTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 22/05/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit
import SafariServices

class DataTableViewController: UITableViewController {
    
    var requiresAttribution = false
    
    var ds : [TableDataEntry]?
    var median : Double?
    
    var workMetric : QuantiData!
    
    var medianRowPlaced : Bool = false
    
    private var bigger : Int?
    private var smaller : Int?

    override func viewDidLoad() {
        super.viewDidLoad()
        
        if ds == nil {
            let ac = UIAlertController(title: "No Data!", message: "There's no data available for the requested range.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .default) {
                _ in
                
                self.navigationController?.popViewController(animated: true)
            })
            
            present(ac, animated: true, completion: nil)
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        if let _ = ds {
            return requiresAttribution ? 4 : 3
        }
        
        return 0
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if section == 3 {
            return 1
        }
        
        if bigger == nil || smaller == nil {
            bigger = 0
            smaller = 0
            
            ds!.forEach {
                entry in
                
                if entry.y > median! {
                    bigger! += 1
                } else {
                    smaller! += 1
                }
            }
        }
        
        if section == 0 {
            return bigger!
        } else if section == 1 {
            return 1
        }
        
        return smaller!
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if indexPath.section == 3 {
            let cell = tableView.dequeueReusableCell(withIdentifier: "PoweredByRowIdentifier", for: indexPath)
            
            return cell
        }
        
        let cell = tableView.dequeueReusableCell(withIdentifier: "DataTableRowIdentifier", for: indexPath)
        
        let entry : TableDataEntry
        
        if indexPath.section == 0 {
            
            entry = ds![indexPath.row]
            
            cell.backgroundColor = #colorLiteral(red: 0.721568644, green: 0.8862745166, blue: 0.5921568871, alpha: 1)
            
        } else if indexPath.section == 1 {
            
            cell.textLabel?.text = "Median"
            cell.detailTextLabel?.text = "\(median!)"
            
            cell.backgroundColor = #colorLiteral(red: 0.9764705896, green: 0.850980401, blue: 0.5490196347, alpha: 1)
            
            return cell
            
        } else {
            
            entry = ds![indexPath.row + bigger!]
            
            cell.backgroundColor = #colorLiteral(red: 0.9568627477, green: 0.6588235497, blue: 0.5450980663, alpha: 1)
            
        }
        
        cell.textLabel?.text = try! Weather(fromRawValue: Int(entry.x)).description
        cell.detailTextLabel?.text = "\(entry.y)"
        
        return cell
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        switch indexPath.section {
            
        case 0:
            
            let ac = UIAlertController(title: "Bigger than the median", message: "The selected value is bigger than the median.\n\nThis means that, on average, the value associated with your \(workMetric.name) should be bigger on days that conform to this weather when compared to other weather types.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .default, handler: nil))
            
            present(ac, animated: true, completion: nil)
            
        case 1:
            
            let ac = UIAlertController(title: "Median", message: "This is your median of daily \(workMetric.name), and does not represent any specific day.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .default, handler: nil))
            
            present(ac, animated: true, completion: nil)
            
        case 2:
            
            let ac = UIAlertController(title: "Smaller than the median", message: "The selected value is smaller than the median.\n\nThis means that, on average, the value associated with your \(workMetric.name) should be smaller on days that conform to this weather when compared to other weather types.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .default, handler: nil))
            
            present(ac, animated: true, completion: nil)
            
        default:
            let vc = SFSafariViewController(url: URL(string: ScatterChartViewController.YahooAttributionURL)!)
            
            present(vc, animated: true, completion: nil)
            
        }
    }

}
