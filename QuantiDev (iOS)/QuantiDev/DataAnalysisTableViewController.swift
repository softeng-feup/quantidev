//
//  DataAnalysisTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 25/05/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

class DataAnalysisTableViewController: UITableViewController {
    
    struct FlattenedAnalysis {
        var pearson : Double
        
        var personal : QuantiData
        var work : QuantiData
    }
    
    var analysisResult : AnalysisDict = [:]
    
    var strong : [FlattenedAnalysis] = []
    var moderate : [FlattenedAnalysis] = []
    var weak : [FlattenedAnalysis] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        
        for (score, rArray) in analysisResult {
            let classif = Correlation.Classification(pearson: score)
            
            for r in rArray {
                switch classif {
                    
                case .strong:
                    strong.append(FlattenedAnalysis(pearson: score, personal: r.personal, work: r.work))
                    
                case .moderate:
                    moderate.append(FlattenedAnalysis(pearson: score, personal: r.personal, work: r.work))
                    
                case .weak:
                    weak.append(FlattenedAnalysis(pearson: score, personal: r.personal, work: r.work))
                    
                case .none:
                    continue
                }
            }
        }
        
        strong = strong.sorted { abs($0.pearson) > abs($1.pearson) }
        moderate = moderate.sorted { abs($0.pearson) > abs($1.pearson) }
        weak = weak.sorted { abs($0.pearson) > abs($1.pearson) }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        return 3
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch section {
            
        case 0:
            return strong.count
            
        case 1:
            return moderate.count
            
        case 2:
            return weak.count
            
        default:
            return 0   //  This can not happen, though.
            
        }
    }
    
    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        switch section {
            
        case 0:
            return "Strong Correlation"
            
        case 1:
            return "Moderate Correlation"
            
        case 2:
            return "Weak Correlation"
            
        default:
            return ""   //  This can not happen, though.
            
        }
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "DataAnalysisCell", for: indexPath)

        let pearson : Double
        let dataTypes : (personal: QuantiData, work: QuantiData)
        
        switch indexPath.section {
            
        case 0:
            pearson = strong[indexPath.row].pearson
            dataTypes = (strong[indexPath.row].personal, strong[indexPath.row].work)
            
        case 1:
            pearson = moderate[indexPath.row].pearson
            dataTypes = (moderate[indexPath.row].personal, moderate[indexPath.row].work)
            
        case 2:
            pearson = weak[indexPath.row].pearson
            dataTypes = (weak[indexPath.row].personal, weak[indexPath.row].work)
            
        default:
            return cell //  This can never happen, though.
            
        }
        
        cell.textLabel?.text = "\(dataTypes.personal.name) ↔️ \(dataTypes.work.name)"
        cell.detailTextLabel?.text = "Pearson Correlation Value: \(pearson)"
        
        if pearson > 0 {
            cell.backgroundColor = #colorLiteral(red: 0.721568644, green: 0.8862745166, blue: 0.5921568871, alpha: 1)
        } else {
            cell.backgroundColor = #colorLiteral(red: 0.9568627477, green: 0.6588235497, blue: 0.5450980663, alpha: 1)
        }

        return cell
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let pearson : Double
        let dataTypes : (personal: QuantiData, work: QuantiData)
        
        switch indexPath.section {
            
        case 0:
            pearson = strong[indexPath.row].pearson
            dataTypes = (strong[indexPath.row].personal, strong[indexPath.row].work)
            
        case 1:
            pearson = moderate[indexPath.row].pearson
            dataTypes = (moderate[indexPath.row].personal, moderate[indexPath.row].work)
            
        case 2:
            pearson = weak[indexPath.row].pearson
            dataTypes = (weak[indexPath.row].personal, weak[indexPath.row].work)
            
        default:
            return //  This can never happen, though.
            
        }
        
        let correlation = Correlation.analyze(value: pearson)
        
        let ac = UIAlertController(title: "Explaination", message: "The two selected variables appear to be \(correlation.0 == .positive ? "positively" : "negatively") associated in a \(correlation.1.rawValue) manner.\n\nWhen the value of \(dataTypes.personal.name) increases, the value of \(dataTypes.work.name) appears to \(correlation.0 == . positive ? "increase" : "decrease"), and vice versa, with a confidence value as represented by the Pearson Correlation value.\n\nPearson Correlation Value: \(pearson)", preferredStyle: .alert)
        
        ac.addAction(UIAlertAction(title: "Ok", style: .default) {
            action in
            
            tableView.deselectRow(at: indexPath, animated: true)
        })
        
        self.present(ac, animated: true, completion: nil)
    }

}
