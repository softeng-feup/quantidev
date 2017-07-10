//
//  CreateGeofenceMapViewController.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 13/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit
import MapKit

class CreateGeofenceMapViewController: UIViewController {
    
    static private let UnwindToGeoTableSegue = "unwindToGeoTableSegue"
    
    @IBOutlet var mapView : MKMapView!
    @IBOutlet var searchTextField : UITextField!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "Add Location"
        
        let rightButtonItem = UIBarButtonItem(barButtonSystemItem: .save, target: self, action: #selector(CreateGeofenceMapViewController.addGeofence))
        
        self.navigationItem.rightBarButtonItem = rightButtonItem
        
        mapView.delegate = self
        searchTextField.delegate = self
        
        let longPressRecognizer = UILongPressGestureRecognizer(target: self, action: #selector(CreateGeofenceMapViewController.handleMapLongPress(_:)))
        
        longPressRecognizer.minimumPressDuration = 0.5
        
        mapView.addGestureRecognizer(longPressRecognizer)
    }
    
    override func viewDidAppear(_ animated: Bool) {
        mapView.showsUserLocation = true
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    func handleMapLongPress(_ gestureRecognizer : UIGestureRecognizer) {
        if gestureRecognizer.state != .began {
            return
        }
        
        let touchPoint = gestureRecognizer.location(in: mapView)
        let touchMapCoordinate = mapView.convert(touchPoint, toCoordinateFrom: mapView)
        
        changePlace(location: touchMapCoordinate, changeRegion: false)
    }
    
    func addGeofence() {
        if self.mapView.annotations.count != 1 {
            let loc = self.mapView.annotations[0]
            
            let gc = CLGeocoder()
            
            gc.reverseGeocodeLocation(CLLocation(latitude: loc.coordinate.latitude, longitude: loc.coordinate.longitude)) {
                placemarks, error in
                
                if let pm = placemarks {
                    if pm.count > 0 {
                        let p = pm[0]
                        
                        let lines = p.addressDictionary!["FormattedAddressLines"] as! [String]
                        
                        LocationManager.sharedInstance.add(location: loc.coordinate, identifier: lines.joined(separator: ", "))
                        
                        self.performSegue(withIdentifier: CreateGeofenceMapViewController.UnwindToGeoTableSegue, sender: self)
                    }
                }
            }
        } else {
            let ac = UIAlertController(title: "Error!", message: "No location was selected!\n\nPlease select one by either typing its address or by performing a long press on its location.", preferredStyle: .alert)
            
            ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
            
            self.present(ac, animated: true, completion: nil)
        }
    }

}

extension CreateGeofenceMapViewController : UITextFieldDelegate {
    
    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        
        let geocoder = CLGeocoder()
        
        geocoder.geocodeAddressString(textField.text!) {
            placemarks, error in
            
            if let e = error {
                let ac = UIAlertController(title: "Error!", message: e.localizedDescription, preferredStyle: .alert)
                
                ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                
                self.present(ac, animated: true, completion: nil)
                
                return
            }
            
            if let pm = placemarks {
                if pm.count != 0 {
                    let p = pm[0]
                    
                    self.changePlace(location: p.location!.coordinate, changeRegion: true)
                } else {
                    let ac = UIAlertController(title: "No Results!", message: "Your search yield no results.", preferredStyle: .alert)
                    
                    ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                    
                    self.present(ac, animated: true, completion: nil)
                }
            } else {
                let ac = UIAlertController(title: "Error!", message: "An error has occurred.", preferredStyle: .alert)
                
                ac.addAction(UIAlertAction(title: "Ok", style: .cancel, handler: nil))
                
                self.present(ac, animated: true, completion: nil)
            }
        }
        
        return true
    }
    
    func changePlace(location: CLLocationCoordinate2D, changeRegion: Bool) {
        let radius = 0.25
        
        var region = MKCoordinateRegion()
        
        region.center = location
        
        region.span = MKCoordinateSpanMake(radius / 112.0, radius / 112.0)
        
        let annotation = MKPointAnnotation()
        
        annotation.coordinate = location
        
        let circle = MKCircle(center: annotation.coordinate, radius: 200)
        
        circle.title = "Selected"
        
        for o in self.mapView.overlays {
            self.mapView.remove(o)
        }
        
        for a in self.mapView.annotations {
            self.mapView.removeAnnotation(a)
        }
        
        self.mapView.addOverlays([circle])
        self.mapView.addAnnotation(annotation)
        
        if changeRegion {
            self.mapView.setRegion(region, animated: true)
        }
    }
    
}

extension CreateGeofenceMapViewController : MKMapViewDelegate {
    
    func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
        let renderer = MKCircleRenderer(overlay: overlay)
        
        renderer.fillColor = UIColor.cyan.withAlphaComponent(0.2)
        renderer.strokeColor = UIColor.blue.withAlphaComponent(0.7)
        renderer.lineWidth = 3
        
        return renderer
    }
    
}
