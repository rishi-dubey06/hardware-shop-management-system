package com.hardwareshop.service;

import com.hardwareshop.dto.request.CustomerRequest;
import com.hardwareshop.dto.response.CustomerResponse;
import com.hardwareshop.entity.Customer;
import com.hardwareshop.exception.ResourceNotFoundException;
import com.hardwareshop.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Page<CustomerResponse> getAllCustomers(String query, Pageable pageable) {
        if (StringUtils.hasText(query)) {
            return customerRepository.findByNameContainingIgnoreCaseOrPhoneNumberContaining(query, query, pageable)
                    .map(this::mapToResponse);
        }
        return customerRepository.findAll(pageable).map(this::mapToResponse);
    }

    public List<CustomerResponse> getRecentCustomers() {
        return customerRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return mapToResponse(customer);
    }

    public Customer getCustomerEntity(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        Customer customer = new Customer(
                request.getName(),
                request.getPhoneNumber(),
                request.getAddress(),
                request.getEmail()
        );
        customer = customerRepository.save(customer);
        log.info("Created customer '{}' (id: {})", customer.getName(), customer.getId());
        return mapToResponse(customer);
    }

    @Transactional
    public Customer findOrCreateCustomer(CustomerRequest request) {
        if (StringUtils.hasText(request.getPhoneNumber())) {
            var existing = customerRepository.findByPhoneNumber(request.getPhoneNumber());
            if (existing.isPresent()) {
                Customer c = existing.get();
                // update name or address if provided
                if (StringUtils.hasText(request.getName())) c.setName(request.getName());
                if (StringUtils.hasText(request.getAddress())) c.setAddress(request.getAddress());
                if (StringUtils.hasText(request.getEmail())) c.setEmail(request.getEmail());
                return customerRepository.save(c);
            }
        }
        Customer newCustomer = new Customer(
                request.getName(),
                request.getPhoneNumber(),
                request.getAddress(),
                request.getEmail()
        );
        return customerRepository.save(newCustomer);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = getCustomerEntity(id);
        customer.setName(request.getName());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setAddress(request.getAddress());
        customer.setEmail(request.getEmail());

        customer = customerRepository.save(customer);
        log.info("Updated customer id: {}", id);
        return mapToResponse(customer);
    }

    public CustomerResponse mapToResponse(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getPhoneNumber(),
                customer.getAddress(),
                customer.getEmail(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
