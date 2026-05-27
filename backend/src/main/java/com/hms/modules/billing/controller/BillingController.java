package com.hms.modules.billing.controller;

import com.hms.common.exception.ResourceNotFoundException;
import com.hms.modules.billing.dto.BillingDTO;
import com.hms.modules.billing.entity.Billing;
import com.hms.modules.billing.repository.BillingRepository;
import com.hms.modules.billing.service.BillingService;
import com.hms.modules.billing.service.PdfGeneratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BillingController {

    private final BillingService billingService;
    private final BillingRepository billingRepository;
    private final PdfGeneratorService pdfGeneratorService;

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

    @GetMapping(value = "/{id}/receipt", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long id) {
        Billing billing = billingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Billing invoice not found with id: " + id));

        byte[] pdfBytes = pdfGeneratorService.generateInvoicePdf(billing);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
