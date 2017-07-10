//
//  GeolocationTableViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 13/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

class GeolocationTableViewController: UITableViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "Work Place(s)"
        
        let rightButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(GeolocationTableViewController.addGeofence))
        
        self.navigationItem.rightBarButtonItem = rightButtonItem
    }
    
    func addGeofence(sender: UIBarButtonItem) {
        performSegue(withIdentifier: "showMapView", sender: nil)
    }
    
    @IBAction func unwindToGeolocationTableViewController(segue: UIStoryboardSegue) {
        //  Unwind here!
        
        self.tableView.reloadData()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    // MARK: - Table view data source

    override func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return LocationManager.sharedInstance.locations.count
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "GeolocationTableViewCell", for: indexPath) as! GeolocationTableViewCell
        
        cell.location = LocationManager.sharedInstance.locations[indexPath.row]

        return cell
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let location = LocationManager.sharedInstance.locations[indexPath.row]
        
        let ac = UIAlertController(title: "Delete Location", message: "Do you want to delete the location \"\(location.identifier)\"?", preferredStyle: .alert)
        
        ac.addAction(UIAlertAction(title: "Delete", style: .destructive) {
            _ in
            
            _ = LocationManager.sharedInstance.remove(location: location)
            
            tableView.reloadData()
        })
        
        ac.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        
        present(ac, animated: true, completion: nil)
        
        tableView.deselectRow(at: indexPath, animated: true)
    }
    
    override func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        guard section == 0 else {
            return nil
        }
        
        return "Locations"
    }
    
    override func tableView(_ tableView: UITableView, titleForFooterInSection section: Int) -> String? {
        guard section == 0 else {
            return nil
        }
        
        return "These locations are used in order to automatically set your \"Working\" status. Your work status (namely, if you are, or not, working) will be shared with your team leader."
    }

}
