package com.hms.controller;

import com.hms.dto.BillingDTO;
import com.hms.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BillingController {

    private final BillingService billingService;

    @PostMapping
    public ResponseEntity<BillingDTO> createInvoice(@Valid @RequestBody BillingDTO billingDTO) {
        return new ResponseEntity<>(billingService.createInvoice(billingDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillingDTO> getBillingById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getBillingById(id));
    }

    @GetMapping
    public ResponseEntity<List<BillingDTO>> getAllBillings() {
        return ResponseEntity.ok(billingService.getAllBillings());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<BillingDTO>> getBillingsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(billingService.getBillingsByPatientId(patientId));
    }

    @PatchMapping("/{id}/payment-status")
    public ResponseEntity<BillingDTO> updatePaymentStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(billingService.updatePaymentStatus(id, status));
    }
}
