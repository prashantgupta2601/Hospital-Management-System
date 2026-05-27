package com.hms.modules.shift.controller;

import com.hms.modules.shift.dto.DoctorShiftDTO;
import com.hms.modules.shift.service.DoctorShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorShiftController {

    private final DoctorShiftService doctorShiftService;

    @PostMapping
    public ResponseEntity<DoctorShiftDTO> createShift(@Valid @RequestBody DoctorShiftDTO dto) {
        return new ResponseEntity<>(doctorShiftService.createShift(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DoctorShiftDTO> updateShift(@PathVariable Long id, @Valid @RequestBody DoctorShiftDTO dto) {
        return ResponseEntity.ok(doctorShiftService.updateShift(id, dto));
    }

    @GetMapping
    public ResponseEntity<List<DoctorShiftDTO>> getAllShifts() {
        return ResponseEntity.ok(doctorShiftService.getAllShifts());
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<DoctorShiftDTO>> getShiftsByDoctorId(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorShiftService.getShiftsByDoctorId(doctorId));
    }

    @GetMapping("/department")
    public ResponseEntity<List<DoctorShiftDTO>> getShiftsByDepartment(@RequestParam String dept) {
        return ResponseEntity.ok(doctorShiftService.getShiftsByDepartment(dept));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        doctorShiftService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }
}
