//
//  GeolocationTableViewCell.swift
//  QuantiDev
//
//  Created by Eduardo Almeida on 13/03/17.
//  Quantified Self for Developers - MSc Thesis, 2016/2017, FEUP
//

import UIKit

class GeolocationTableViewCell: UITableViewCell {
    
    var location : Location? {
        didSet {
            changedLocation()
        }
    }

    override func awakeFromNib() {
        super.awakeFromNib()
        // Initialization code
    }

    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)

        // Configure the view for the selected state
    }
    
    func changedLocation() {
        if let l = location {
            self.textLabel?.text = l.identifier
            self.detailTextLabel?.text = "\(l.center.latitude), \(l.center.longitude)"
        }
        
    }

}
