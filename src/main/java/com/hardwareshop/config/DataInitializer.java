package com.hardwareshop.config;

import com.hardwareshop.entity.Customer;
import com.hardwareshop.entity.Product;
import com.hardwareshop.entity.Role;
import com.hardwareshop.entity.User;
import com.hardwareshop.repository.CustomerRepository;
import com.hardwareshop.repository.ProductRepository;
import com.hardwareshop.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ProductRepository productRepository,
                           CustomerRepository customerRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCustomers();
        seedProducts();
    }

    private void seedUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("Admin@123"),
                    "admin@hardwareshop.local",
                    "Store Administrator",
                    Role.ROLE_ADMIN
            );
            userRepository.save(admin);
            log.info("Initialized default ADMIN user: username='admin', password='Admin@123'");
        }

        if (!userRepository.existsByUsername("customer")) {
            User customer = new User(
                    "customer",
                    passwordEncoder.encode("Customer@123"),
                    "customer@hardwareshop.local",
                    "Retail Customer",
                    Role.ROLE_CUSTOMER
            );
            userRepository.save(customer);
            log.info("Initialized default CUSTOMER user: username='customer', password='Customer@123'");
        }
    }

    private void seedCustomers() {
        if (customerRepository.count() == 0) {
            Customer c1 = new Customer(
                    "Rahul Sharma",
                    "9876543210",
                    "Greater Noida, Uttar Pradesh",
                    "rahul.sharma@example.com"
            );
            Customer c2 = new Customer(
                    "Amit Verma",
                    "9811223344",
                    "Sector 62, Noida, Uttar Pradesh",
                    "amit.verma@example.com"
            );
            Customer c3 = new Customer(
                    "Pooja Patel",
                    "9822334455",
                    "Connaught Place, New Delhi",
                    "pooja.patel@example.com"
            );
            customerRepository.save(c1);
            customerRepository.save(c2);
            customerRepository.save(c3);
            log.info("Seeded 3 initial customer records");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            Product p1 = new Product(
                    "PVC Pipe (10 ft, 1 inch)",
                    "Durable high-grade unplasticized polyvinyl chloride pipe for plumbing and drainage.",
                    "Plumbing",
                    new BigDecimal("150.00"),
                    50,
                    null,
                    10,
                    true
            );

            Product p2 = new Product(
                    "Steel Hammer 500g",
                    "Drop forged carbon steel head with shock-absorbing anti-slip rubber fiberglass grip.",
                    "Hand Tools",
                    new BigDecimal("400.00"),
                    25,
                    null,
                    5,
                    true
            );

            Product p3 = new Product(
                    "Cordless Power Drill 18V",
                    "Variable speed 2-gear reversible lithium-ion cordless drill kit with battery & charger.",
                    "Power Tools",
                    new BigDecimal("3499.00"),
                    12,
                    null,
                    3,
                    true
            );

            Product p4 = new Product(
                    "Brass Ball Valve 1 inch",
                    "Heavy-duty forged brass full port ball valve with quarter-turn lever handle.",
                    "Plumbing",
                    new BigDecimal("280.00"),
                    8, // Low stock demo: 8 <= 10
                    null,
                    10,
                    true
            );

            Product p5 = new Product(
                    "Screwdriver Set 6-Piece",
                    "Magnetic chrome vanadium steel slotted and Phillips screwdriver set.",
                    "Hand Tools",
                    new BigDecimal("320.00"),
                    40,
                    null,
                    10,
                    true
            );

            Product p6 = new Product(
                    "Insulated Copper Wire 1.5mm (90m)",
                    "FR PVC insulated flame retardant industrial copper multi-strand wire roll.",
                    "Electrical",
                    new BigDecimal("1250.00"),
                    30,
                    null,
                    8,
                    true
            );

            Product p7 = new Product(
                    "LED Waterproof Flood Light 50W",
                    "IP66 outdoor waterproof daylight white security spotlight.",
                    "Electrical",
                    new BigDecimal("850.00"),
                    0, // Out of stock demo
                    null,
                    5,
                    true
            );
            p7.setExpectedRestockDate(LocalDate.now().plusDays(5));

            Product p8 = new Product(
                    "Heavy Duty Hex Bolt & Nut M10 (50 Pcs)",
                    "Zinc-plated Grade 8.8 carbon steel hexagonal head bolts with matching nuts.",
                    "Fasteners",
                    new BigDecimal("220.00"),
                    100,
                    null,
                    20,
                    true
            );

            productRepository.save(p1);
            productRepository.save(p2);
            productRepository.save(p3);
            productRepository.save(p4);
            productRepository.save(p5);
            productRepository.save(p6);
            productRepository.save(p7);
            productRepository.save(p8);

            log.info("Seeded 8 initial hardware shop catalog products");
        }
    }
}
