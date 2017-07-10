//
//  DataSelectionTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 31/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

import Charts
import EZLoadingActivity

class DataSelectionTableViewController: UITableViewController {
    
    var personalData : QuantiData?
    var workData : QuantiData?
    var interval : Interval?
    
    var buildDataChartResult : (ds: [ChartDataEntry], ms: [ChartDataEntry], attr: Bool, x: AxisFormatter?, y: AxisFormatter?)?
    var buildDataTableResult : (ds: [TableDataEntry], m: Double)?

    override func viewDidLoad() {
        super.viewDidLoad()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        return 3
    }
    
    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        switch section {
            
        case 0:
            return "Person-Related Data"
            
        case 1:
            return "Work-Related Data"
            
        case 2:
            return "Data Interval"
            
        default:
            return "Error..."
            
        }
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch section {
            
        case 0:
            return QuantiData.personalDataTypes.count
            
        case 1:
            return QuantiData.workDataTypes.count
            
        case 2:
            return 4
            
        default:
            return 0
            
        }
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        if (indexPath.section == 2) {
            let cell = tableView.dequeueReusableCell(withIdentifier: "IntervalCell", for: indexPath)
            
            switch indexPath.row {
                
            case 0:
                cell.textLabel?.text = "Last Week"
                
            case 1:
                cell.textLabel?.text = "Last Month"
                
            case 2:
                cell.textLabel?.text = "Last 3 Months"
                
            case 3:
                cell.textLabel?.text = "Last 6 Months"
                
            case 4:
                cell.textLabel?.text = "Last Year"
                
            default:
                cell.textLabel?.text = "Error!"
                
            }
            
            return cell
        }
        
        let cell = tableView.dequeueReusableCell(withIdentifier: "DataKindCell", for: indexPath)
        
        let obj = (indexPath.section == 0 ? QuantiData.personalDataTypes : QuantiData.workDataTypes)[indexPath.row]
        
        cell.textLabel?.text = obj.name
        cell.detailTextLabel?.text = "\(obj.kind.rawValue), \(obj.type.rawValue)"

        return cell
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        var i = 0
        
        while true {
            let idxPath = IndexPath(row: i, section: indexPath.section)
            
            if idxPath.row != indexPath.row {
                guard let cell = tableView.cellForRow(at: idxPath) else {
                    break
                }
                
                cell.accessoryType = .none
            }
            
            i += 1
        }
        
        let cell = tableView.cellForRow(at: indexPath)!
        
        cell.accessoryType = (cell.accessoryType == .none ? .checkmark : .none)
        
        if indexPath.section == 0 {
            if cell.accessoryType == .none {
                personalData = nil
            } else {
                personalData = QuantiData.personalDataTypes[indexPath.row]
            }
        } else if indexPath.section == 1 {
            if cell.accessoryType == .none {
                workData = nil
            } else {
                workData = QuantiData.workDataTypes[indexPath.row]
            }
        } else {
            if cell.accessoryType == .none {
                interval = nil
            } else {
                interval = Interval(rawValue: indexPath.row)!
            }
        }
        
        tableView.deselectRow(at: indexPath, animated: true)
    }
    
    @IBAction func createChart() {
        buildDataChartResult = nil
        buildDataTableResult = nil
        
        if personalData == nil || workData == nil || interval == nil {
            let ac = UIAlertController(title: "Error!", message: "You must select a row on each one of the sections in order to generate a chart.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
            
            self.present(ac, animated: true, completion: nil)
            
            return
        }
        
        let _ = EZLoadingActivity.show("Crunching data...", disableUI: true)
        
        if (personalData!.representation! == .table) {
            TableDataFactory.buildData(personalData: personalData!, workData: workData!, interval: interval!) {
                dataEntries, median in
                
                DispatchQueue.main.async {
                    self.buildDataTableResult = (dataEntries, median)
                    
                    self.performSegue(withIdentifier: "buildTableSegue", sender: nil)
                }
            }
        } else {
            ChartDataFactory.buildData(personalData: personalData!, workData: workData!, interval: interval!) {
                dataEntries, medianEntries, attribution, xDelegate, yDelegate in
                
                DispatchQueue.main.async {
                    self.buildDataChartResult = (dataEntries, medianEntries, attribution, xDelegate, yDelegate)
                    
                    self.performSegue(withIdentifier: "buildChartSegue", sender: nil)
                }
            }
        }
    }
    
    @IBAction func performFullAnalysis() {
        
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "buildChartSegue" {
            let sc = segue.destination as! ScatterChartViewController
            
            //  sc.requiresAttribution = buildDataChartResult!.attr
            
            sc.requiresAttribution = false
            
            if let af = buildDataChartResult!.x {
                sc.xAxisDelegate = af
            }
            
            if let af = buildDataChartResult!.y {
                sc.yAxisDelegate = af
            }
            
            if buildDataChartResult!.ds.count != 0 {
                sc.values = buildDataChartResult!.ds
            }
            
            if buildDataChartResult!.ms.count != 0 {
                sc.medianValues = buildDataChartResult!.ms
            }
            
            sc.chartDescription = "\(personalData!.name) vs \(workData!.name)"
            
            sc.personalData = personalData
            sc.workData = workData
        } else if segue.identifier == "buildTableSegue" {
            let dt = segue.destination as! DataTableViewController
            
            if buildDataTableResult!.ds.count != 0 {
                dt.ds = buildDataTableResult!.ds
                dt.median = buildDataTableResult!.m
            }
            
            dt.workMetric = workData!
            
            dt.requiresAttribution = true   //  TODO: Fix this?
        }
        
        let _ = EZLoadingActivity.hide()
    }
    
}
