package com.hms.modules.record.controller;

import com.hms.modules.record.dto.MedicalRecordDTO;
import com.hms.modules.record.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<MedicalRecordDTO> createMedicalRecord(@Valid @RequestBody MedicalRecordDTO dto) {
        return new ResponseEntity<>(medicalRecordService.createMedicalRecord(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicalRecordDTO> getMedicalRecordById(@PathVariable Long id) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordById(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalRecordDTO>> getMedicalRecordsByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByPatientId(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<MedicalRecordDTO>> getMedicalRecordsByDoctorId(@PathVariable Long doctorId) {
        return ResponseEntity.ok(medicalRecordService.getMedicalRecordsByDoctorId(doctorId));
    }

    @GetMapping
    public ResponseEntity<List<MedicalRecordDTO>> getAllMedicalRecords() {
        return ResponseEntity.ok(medicalRecordService.getAllMedicalRecords());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicalRecord(@PathVariable Long id) {
        medicalRecordService.deleteMedicalRecord(id);
        return ResponseEntity.noContent().build();
    }
}
