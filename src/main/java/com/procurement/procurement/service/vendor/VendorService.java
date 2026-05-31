package com.procurement.procurement.service.vendor;

import com.procurement.procurement.entity.vendor.Vendor;
import com.procurement.procurement.repository.vendor.VendorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VendorService {

    @Autowired
    private VendorRepository vendorRepository;

    // create new vendor
    public Vendor createVendor(Vendor vendor) {
        return vendorRepository.save(vendor);
    }

    // update existing vendor
    public Vendor updateVendor(Long id, Vendor updatedVendor) {
        Optional<Vendor> optionalVendor = vendorRepository.findById(id);
        if (optionalVendor.isPresent()) {
            Vendor vendor = optionalVendor.get();
            vendor.setName(updatedVendor.getName());
            vendor.setEmail(updatedVendor.getEmail());
            vendor.setPhone(updatedVendor.getPhone());
            vendor.setAddress(updatedVendor.getAddress());
            vendor.setStatus(updatedVendor.getStatus());
            return vendorRepository.save(vendor);
        }
        throw new RuntimeException("Vendor not found with id: " + id);
    }

    // get all vendors
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    // get vendor by id
    public Vendor getVendorById(Long id) {
        return vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
    }

    // search vendors by name
    public List<Vendor> getVendorsByName(String name) {
        return vendorRepository.findByNameContainingIgnoreCase(name);
    }

    // delete vendor
    public void deleteVendor(Long id) {
        Vendor vendor = getVendorById(id);
        vendorRepository.delete(vendor);
    }
}