package com.procurement.procurement.controller.vendor;

import com.procurement.procurement.entity.vendor.Vendor;
import com.procurement.procurement.repository.vendor.VendorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/vendor")
@PreAuthorize("hasAnyAuthority('ROLE_PROCUREMENT_MANAGER', 'ROLE_ADMIN')")
public class VendorController {

    private final VendorRepository vendorRepository;

    public VendorController(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    // create vendor
    @PostMapping("/create")
    public ResponseEntity<Vendor> createVendor(@RequestBody Vendor vendor) {
        vendor.setStatus("APPROVED");
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }

    // get all vendors
    @GetMapping("/all")
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(vendorRepository.findAll());
    }

    // get vendor by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getVendorById(@PathVariable Long id) {
        Optional<Vendor> vendorOpt = vendorRepository.findById(id);
        if (vendorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Vendor not found");
        }
        return ResponseEntity.ok(vendorOpt.get());
    }

    // update vendor
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateVendor(@PathVariable Long id, @RequestBody Vendor vendor) {
        Optional<Vendor> vendorOpt = vendorRepository.findById(id);
        if (vendorOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Vendor not found");
        }

        Vendor existingVendor = vendorOpt.get();
        existingVendor.setName(vendor.getName());
        existingVendor.setEmail(vendor.getEmail());
        existingVendor.setContactNumber(vendor.getContactNumber());
        existingVendor.setAddress(vendor.getAddress());
        existingVendor.setStatus(vendor.getStatus());

        vendorRepository.save(existingVendor);
        return ResponseEntity.ok(existingVendor);
    }

    // delete vendor
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteVendor(@PathVariable Long id) {
        if (!vendorRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Vendor not found");
        }
        vendorRepository.deleteById(id);
        return ResponseEntity.ok("Vendor deleted successfully");
    }
}
