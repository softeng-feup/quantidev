//
//  ScatterChartViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 09/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit
import SafariServices

import Charts
import SigmaSwiftStatistics

class ScatterChartViewController: UIViewController {
    
    static let YahooAttributionURL = "https://www.yahoo.com/?ilc=401"
    
    var requiresAttribution = false
    
    @IBOutlet var chartView : CombinedChartView!
    @IBOutlet var yAttributionButton : UIButton!
    
    var values : [ChartDataEntry] = []
    var medianValues : [ChartDataEntry] = []
    
    var personalData : QuantiData!
    var workData : QuantiData!
    
    var chartDescription : String = ""
    
    var useHMS : Bool = false
    
    var xAxisDelegate : AxisFormatter?
    var yAxisDelegate : AxisFormatter?

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "Chart"
        
        self.yAttributionButton.isHidden = !requiresAttribution
        
        if values.count > 0 {
            updateChartWithData()
        }
    }
    
    func updateChartWithData() {
        let set = ScatterChartDataSet(values: values, label: nil)
        
        set.setScatterShape(.circle)
        set.scatterShapeSize = 6.0
        set.scatterShapeHoleRadius = 6.0
        set.scatterShapeHoleColor = #colorLiteral(red: 0.2549019754, green: 0.2745098174, blue: 0.3019607961, alpha: 1)
        
        let scatterData = ScatterChartData(dataSet: set)
        
        let combinedChartData = CombinedChartData();
        
        combinedChartData.scatterData = scatterData
        
        if medianValues.count > 0 {
            let medSet = LineChartDataSet(values: medianValues, label: nil)
            
            medSet.circleRadius = 0.0
            medSet.colors = [UIColor.lightGray]
            
            medSet.mode = .horizontalBezier
            
            let lineData = LineChartData(dataSet: medSet)
            
            combinedChartData.lineData = lineData
        }
        
        chartView.data = combinedChartData
        chartView.noDataText = "There was no data available for the selected fields."
        
        chartView.drawOrder = [CombinedChartView.DrawOrder.scatter.rawValue, CombinedChartView.DrawOrder.line.rawValue]
        
        chartView.chartDescription?.text = chartDescription
        
        chartView.xAxis.drawGridLinesEnabled = true
        chartView.xAxis.drawAxisLineEnabled = true
        chartView.xAxis.labelPosition = .bottom
        chartView.xAxis.axisMinimum = 0.0
        
        chartView.animate(xAxisDuration: 0.5, yAxisDuration: 0.5, easingOption: .easeInSine)
        
        if let a = xAxisDelegate {
            chartView.xAxis.valueFormatter = a
            
            if let g = a.granularity {
                chartView.xAxis.granularity = g
            }
            
            if let min = a.minimum {
                chartView.xAxis.axisMinimum = min
            }
            
            if let max = a.maximum {
                chartView.xAxis.axisMaximum = max
            }
        }
        
        if let a = yAxisDelegate {
            chartView.leftAxis.valueFormatter = a
            chartView.rightAxis.valueFormatter = a
            
            if let g = a.granularity {
                chartView.leftAxis.granularity = g
                chartView.rightAxis.granularity = g
            }
            
            if let min = a.minimum {
                chartView.leftAxis.axisMinimum = min
                chartView.rightAxis.axisMinimum = min
            }
            
            if let max = a.maximum {
                chartView.leftAxis.axisMaximum = max
                chartView.rightAxis.axisMaximum = max
            }
        }
        
        chartView.legend.enabled = false
    }
    
    @IBAction func openYahooAttribution() {
        let vc = SFSafariViewController(url: URL(string: ScatterChartViewController.YahooAttributionURL)!)
        
        present(vc, animated: true, completion: nil)
    }
    
    @IBAction func findCorrelation() {
        var x : [Double] = []
        var y : [Double] = []
        
        for v in values {
            x.append(v.x)
            y.append(v.y)
        }
        
        guard let pearson = Sigma.pearson(x: x, y: y) else {
            let ac = UIAlertController(title: "Error!", message: "An error has occured while calculating a Pearson value for the selected dataset.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
            
            self.present(ac, animated: true, completion: nil)
            
            return
        }
        
        let correlation = Correlation.analyze(value: pearson)
        
        let ac = UIAlertController(title: "Correlation Analysis", message: "The two selected variables appear to be \(correlation.0 == .positive ? "positively" : "negatively") associated in a \(correlation.1.rawValue) manner.\n\nWhen the value of \(personalData.name) increases, the value of \(workData.name) appears to \(correlation.0 == . positive ? "increase" : "decrease"), and vice versa, with a confidence value as represented by the Pearson Correlation value.\n\nPearson Correlation Value: \(pearson)", preferredStyle: .alert)
        
        ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
        
        self.present(ac, animated: true, completion: nil)
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

}
