# Hostinger Deployment Instructions

## Introduction
This document provides deployment instructions for hosting applications on Hostinger, covering both VPS and shared hosting environments.

## Deploying on Hostinger VPS
1. **Log in to your Hostinger account.**
2. **Access the VPS dashboard.**
3. **Connect to your VPS via SSH:**  
   - Open your terminal and run:
   ```bash
   ssh root@your-vps-ip-address
   ```
4. **Update your server:**  
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
5. **Install necessary software:**  
   Depending on your application stack, you may need to install:
   - Nginx or Apache
   - PHP
   - MySQL/MariaDB

6. **Upload your application files:**  
   You can use SCP or SFTP to upload your files.
7. **Configure your web server:**  
   Set up your web server configuration to point to your application directory.
8. **Start the server and ensure it runs on boot.**

## Deploying on Hostinger Shared Hosting
1. **Log in to your Hostinger account.**
2. **Navigate to the Hosting tab.**
3. **Select your domain.**
4. **Use the File Manager or FTP client to upload your application files.**
5. **Extract your files if they are in a compressed format.**
6. **Configure the application:**
   - Edit configuration files as necessary, e.g., database connections, environment variables.
7. **Set up the database:**  
   Create and configure your database using the Control Panel.
8. **Test your application in a browser.**

## Additional Tips
- Consider securing your application with SSL.
- Regular backups are recommended.

For detailed troubleshooting and advanced configurations, refer to the Hostinger knowledge base or support documentation.