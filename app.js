// ITMS Dashboard JavaScript

class ITMSApplication {
    constructor() {
        this.currentData = {
            track_parameters: {
                gauge: { value: 1435.2, unit: "mm", status: "normal", threshold: 1440 },
                alignment: { value: 2.1, unit: "mm", status: "normal", threshold: 10 },
                unevenness: { value: 3.8, unit: "mm", status: "normal", threshold: 15 },
                twist: { value: 1.2, unit: "mm", status: "normal", threshold: 8 },
                cross_level: { value: 4.5, unit: "mm", status: "normal", threshold: 12 }
            },
            gps_data: {
                latitude: 28.6139,
                longitude: 77.2090,
                altitude: 216,
                speed: 85,
                heading: 45,
                chainage: "KM 1247.350"
            },
            system_info: {
                recording_status: "active",
                sampling_interval: "0.25m",
                data_storage: 78,
                communication: "connected"
            },
            branding: {
                company_name: "Team AAMCA",
                website: "www.teamaamca.ai",
                footer_text: "Made by Team AAMCA"
            }
        };

        this.charts = {};
        this.map = null;
        this.isRecording = true;
        this.dataHistory = [];
        this.currentModule = 'live-monitoring';
        this.alerts = [
            { id: 1, time: "10:45:32", severity: "High", type: "Track Geometry", description: "Gauge widening detected", location: "KM 1245.120", status: "Active" },
            { id: 2, time: "10:42:15", severity: "Medium", type: "Rail Wear", description: "Lateral wear exceeding 0.15mm", location: "KM 1244.890", status: "Acknowledged" },
            { id: 3, time: "10:38:47", severity: "Critical", type: "Track Alignment", description: "Severe alignment deviation", location: "KM 1244.650", status: "Under Investigation" }
        ];

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupTimeUpdates();
        this.setupCharts();
        this.setupEventListeners();
        this.startDataSimulation();
        this.updateDisplays();
        this.updateBranding();
        
        // Ensure initial module is displayed
        this.showModule('live-monitoring');
    }

    updateBranding() {
        console.log(`ITMS Dashboard initialized for ${this.currentData.branding.company_name}`);
        console.log(`Visit us at ${this.currentData.branding.website}`);
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetModule = link.getAttribute('data-module');
                
                console.log('Navigation clicked:', targetModule);
                
                // Update active nav link
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
                
                // Show target module
                this.showModule(targetModule);
            });
        });
    }

    showModule(moduleId) {
        console.log('Showing module:', moduleId);
        
        // Hide all modules
        const allModules = document.querySelectorAll('.module');
        allModules.forEach(module => {
            module.classList.add('hidden');
            module.classList.remove('active');
        });
        
        // Show target module
        const targetModule = document.getElementById(moduleId);
        if (targetModule) {
            targetModule.classList.remove('hidden');
            targetModule.classList.add('active');
            this.currentModule = moduleId;
            
            // Initialize module-specific functionality
            setTimeout(() => {
                if (moduleId === 'gps-tracking' && !this.map) {
                    this.initializeMap();
                }
                if (moduleId === 'track-analysis') {
                    this.updateAnalysisCharts();
                }
            }, 100);
        } else {
            console.error('Module not found:', moduleId);
        }
    }

    setupTimeUpdates() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { hour12: false });
            const dateString = now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'short', 
                day: '2-digit' 
            });

            const timeElement = document.getElementById('currentTime');
            const dateElement = document.getElementById('currentDate');
            
            if (timeElement) timeElement.textContent = timeString;
            if (dateElement) dateElement.textContent = dateString;
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    setupCharts() {
        // Live Monitoring Chart
        const parametersCtx = document.getElementById('parametersChart');
        if (parametersCtx) {
            this.charts.parameters = new Chart(parametersCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Gauge (mm)',
                            data: [],
                            borderColor: '#1FB8CD',
                            backgroundColor: 'rgba(31, 184, 205, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Alignment (mm)',
                            data: [],
                            borderColor: '#FFC185',
                            backgroundColor: 'rgba(255, 193, 133, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Cross Level (mm)',
                            data: [],
                            borderColor: '#B4413C',
                            backgroundColor: 'rgba(180, 65, 60, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Value (mm)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Distance (KM)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
        }
    }

    initializeMap() {
        const mapElement = document.getElementById('trackMap');
        if (mapElement && !this.map) {
            try {
                console.log('Initializing map...');
                this.map = L.map('trackMap').setView([28.6139, 77.2090], 13);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors | © Team AAMCA Railway Solutions'
                }).addTo(this.map);

                // Add current position marker
                this.currentPositionMarker = L.marker([28.6139, 77.2090])
                    .addTo(this.map)
                    .bindPopup('Current Position<br>KM 1247.350<br><small>Team AAMCA ITMS</small>')
                    .openPopup();

                // Add track route
                const trackRoute = [
                    [28.6000, 77.2000],
                    [28.6139, 77.2090],
                    [28.6300, 77.2200],
                    [28.6450, 77.2350]
                ];

                L.polyline(trackRoute, {color: '#1FB8CD', weight: 3}).addTo(this.map);

                // Add fault markers
                const faultIcon = L.divIcon({
                    className: 'fault-marker',
                    html: '<div style="background: #ff4444; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>',
                    iconSize: [16, 16]
                });

                L.marker([28.6050, 77.2050], {icon: faultIcon})
                    .addTo(this.map)
                    .bindPopup('Critical Fault<br>KM 1244.650<br>Alignment Deviation<br><small>Detected by Team AAMCA ITMS</small>');

                L.marker([28.6080, 77.2060], {icon: faultIcon})
                    .addTo(this.map)
                    .bindPopup('High Priority<br>KM 1245.120<br>Gauge Widening<br><small>Detected by Team AAMCA ITMS</small>');
                    
                // Force map refresh
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize();
                        console.log('Map initialized successfully');
                    }
                }, 200);
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        }
    }

    updateAnalysisCharts() {
        // Geometry Chart
        const geometryCtx = document.getElementById('geometryChart');
        if (geometryCtx && !this.charts.geometry) {
            console.log('Creating geometry chart...');
            const distances = [];
            const gaugeData = [];
            const alignmentData = [];
            const crossLevelData = [];

            // Generate sample data
            for (let i = 0; i < 50; i++) {
                distances.push((1240 + i * 0.1).toFixed(1));
                gaugeData.push(1435 + Math.random() * 10 - 5);
                alignmentData.push(Math.random() * 8 - 4);
                crossLevelData.push(Math.random() * 10 - 5);
            }

            this.charts.geometry = new Chart(geometryCtx, {
                type: 'line',
                data: {
                    labels: distances,
                    datasets: [
                        {
                            label: 'Track Gauge',
                            data: gaugeData,
                            borderColor: '#1FB8CD',
                            backgroundColor: 'rgba(31, 184, 205, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Alignment',
                            data: alignmentData,
                            borderColor: '#FFC185',
                            backgroundColor: 'rgba(255, 193, 133, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Cross Level',
                            data: crossLevelData,
                            borderColor: '#B4413C',
                            backgroundColor: 'rgba(180, 65, 60, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            title: {
                                display: true,
                                text: 'Value (mm)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Chainage (KM)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Track Analysis - Team AAMCA ITMS'
                        }
                    }
                }
            });
        }

        // Wear Chart
        const wearCtx = document.getElementById('wearChart');
        if (wearCtx && !this.charts.wear) {
            console.log('Creating wear chart...');
            const wearDistances = [];
            const lateralWear = [];
            const verticalWear = [];

            for (let i = 0; i < 30; i++) {
                wearDistances.push((1240 + i * 0.2).toFixed(1));
                lateralWear.push(Math.random() * 0.3);
                verticalWear.push(Math.random() * 0.25);
            }

            this.charts.wear = new Chart(wearCtx, {
                type: 'bar',
                data: {
                    labels: wearDistances,
                    datasets: [
                        {
                            label: 'Lateral Wear (mm)',
                            data: lateralWear,
                            backgroundColor: '#5D878F',
                            borderColor: '#5D878F',
                            borderWidth: 1
                        },
                        {
                            label: 'Vertical Wear (mm)',
                            data: verticalWear,
                            backgroundColor: '#DB4545',
                            borderColor: '#DB4545',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Wear (mm)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Chainage (KM)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Rail Wear Analysis - Team AAMCA ITMS'
                        }
                    }
                }
            });
        }
    }

    setupEventListeners() {
        // System Control Events
        const startBtn = document.getElementById('startRecording');
        const pauseBtn = document.getElementById('pauseRecording');
        const stopBtn = document.getElementById('stopRecording');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.isRecording = true;
                this.updateRecordingStatus('Active');
                startBtn.disabled = true;
                if (pauseBtn) pauseBtn.disabled = false;
                if (stopBtn) stopBtn.disabled = false;
                console.log('Recording started');
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.isRecording = false;
                this.updateRecordingStatus('Paused');
                if (startBtn) startBtn.disabled = false;
                pauseBtn.disabled = true;
                if (stopBtn) stopBtn.disabled = false;
                console.log('Recording paused');
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.isRecording = false;
                this.updateRecordingStatus('Stopped');
                if (startBtn) startBtn.disabled = false;
                if (pauseBtn) pauseBtn.disabled = true;
                stopBtn.disabled = true;
                console.log('Recording stopped');
            });
        }

        // Export Events
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                this.exportData(format);
                console.log('Export requested:', format);
            });
        });

        // Alert Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterAlerts(btn.getAttribute('data-filter'));
                console.log('Alert filter applied:', btn.getAttribute('data-filter'));
            });
        });

        // Alert Actions
        document.querySelectorAll('.alert-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.textContent.trim();
                if (action === 'Acknowledge') {
                    btn.textContent = 'View';
                    btn.classList.remove('btn--primary');
                    btn.classList.add('btn--secondary');
                    const statusElement = btn.parentElement.querySelector('.alert-status');
                    if (statusElement) {
                        statusElement.textContent = 'Acknowledged';
                        statusElement.classList.remove('active');
                        statusElement.classList.add('acknowledged');
                    }
                    console.log('Alert acknowledged');
                }
            });
        });

        // Diagram Tabs
        document.querySelectorAll('.diagram-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const diagramType = tab.getAttribute('data-diagram');
                this.switchDiagram(diagramType);
                console.log('Diagram switched to:', diagramType);
            });
        });

        // Diagnostics
        const diagnosticsBtn = document.getElementById('runDiagnostics');
        if (diagnosticsBtn) {
            diagnosticsBtn.addEventListener('click', () => {
                this.runDiagnostics();
            });
        }

        // Generate Report
        const reportBtn = document.getElementById('generateReport');
        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }
    }

    startDataSimulation() {
        setInterval(() => {
            if (this.isRecording) {
                this.simulateDataUpdates();
                this.updateDisplays();
                this.updateCharts();
            }
        }, 2000); // Update every 2 seconds
    }

    simulateDataUpdates() {
        // Simulate slight variations in track parameters
        const params = this.currentData.track_parameters;
        
        params.gauge.value += (Math.random() - 0.5) * 2;
        params.alignment.value += (Math.random() - 0.5) * 1;
        params.unevenness.value += (Math.random() - 0.5) * 1.5;
        params.twist.value += (Math.random() - 0.5) * 0.8;
        params.cross_level.value += (Math.random() - 0.5) * 1.2;

        // Keep values within reasonable ranges
        params.gauge.value = Math.max(1430, Math.min(1445, params.gauge.value));
        params.alignment.value = Math.max(-5, Math.min(15, params.alignment.value));
        params.unevenness.value = Math.max(0, Math.min(20, params.unevenness.value));
        params.twist.value = Math.max(0, Math.min(10, params.twist.value));
        params.cross_level.value = Math.max(-8, Math.min(15, params.cross_level.value));

        // Update status based on thresholds
        Object.keys(params).forEach(key => {
            const param = params[key];
            if (param.value > param.threshold * 0.8) {
                param.status = param.value > param.threshold ? 'critical' : 'warning';
            } else {
                param.status = 'normal';
            }
        });

        // Update GPS data
        this.currentData.gps_data.latitude += (Math.random() - 0.5) * 0.0001;
        this.currentData.gps_data.longitude += (Math.random() - 0.5) * 0.0001;
        this.currentData.gps_data.speed += (Math.random() - 0.5) * 5;
        this.currentData.gps_data.speed = Math.max(0, Math.min(200, this.currentData.gps_data.speed));

        // Update chainage
        const chainageNum = parseFloat(this.currentData.gps_data.chainage.split(' ')[1]) + 0.05;
        this.currentData.gps_data.chainage = `KM ${chainageNum.toFixed(3)}`;

        // Store data history for charts
        this.dataHistory.push({
            timestamp: Date.now(),
            chainage: chainageNum,
            ...params
        });

        // Keep only last 50 data points
        if (this.dataHistory.length > 50) {
            this.dataHistory.shift();
        }
    }

    updateDisplays() {
        // Update parameter cards
        const params = this.currentData.track_parameters;
        
        Object.keys(params).forEach(key => {
            const param = params[key];
            const valueElement = document.getElementById(`${key}Value`);
            if (valueElement) {
                valueElement.textContent = param.value.toFixed(1);
            }

            // Update status indicators
            const paramCard = valueElement?.closest('.parameter-card');
            if (paramCard) {
                const statusElement = paramCard.querySelector('.parameter-status');
                if (statusElement) {
                    statusElement.className = `parameter-status ${param.status}`;
                    statusElement.textContent = param.status.charAt(0).toUpperCase() + param.status.slice(1);
                }
            }
        });

        // Update header status
        const speedElement = document.getElementById('currentSpeed');
        const chainageElement = document.getElementById('currentChainage');
        if (speedElement) speedElement.textContent = `${Math.round(this.currentData.gps_data.speed)} km/h`;
        if (chainageElement) chainageElement.textContent = this.currentData.gps_data.chainage;

        // Update GPS coordinates
        const latElement = document.getElementById('latitude');
        const lonElement = document.getElementById('longitude');
        const altElement = document.getElementById('altitude');
        const mapChainageElement = document.getElementById('mapChainage');
        const headingElement = document.getElementById('heading');
        
        if (latElement) latElement.textContent = this.currentData.gps_data.latitude.toFixed(4);
        if (lonElement) lonElement.textContent = this.currentData.gps_data.longitude.toFixed(4);
        if (altElement) altElement.textContent = this.currentData.gps_data.altitude;
        if (mapChainageElement) mapChainageElement.textContent = this.currentData.gps_data.chainage;
        if (headingElement) headingElement.textContent = `${this.currentData.gps_data.heading.toString().padStart(3, '0')}°`;

        // Update distance traveled
        const distanceElement = document.getElementById('distanceTraveled');
        if (distanceElement) {
            const baseKm = 1222.650;
            const currentKm = parseFloat(this.currentData.gps_data.chainage.split(' ')[1]);
            const distance = (currentKm - baseKm).toFixed(1);
            distanceElement.textContent = `${distance} km`;
        }

        // Update map marker if map exists
        if (this.map && this.currentPositionMarker) {
            const newPos = [this.currentData.gps_data.latitude, this.currentData.gps_data.longitude];
            this.currentPositionMarker.setLatLng(newPos);
            this.currentPositionMarker.setPopupContent(`Current Position<br>${this.currentData.gps_data.chainage}<br><small>Team AAMCA ITMS</small>`);
        }
    }

    updateCharts() {
        if (this.charts.parameters && this.dataHistory.length > 0) {
            const labels = this.dataHistory.map(d => d.chainage.toFixed(3));
            const gaugeData = this.dataHistory.map(d => d.gauge.value);
            const alignmentData = this.dataHistory.map(d => d.alignment.value);
            const crossLevelData = this.dataHistory.map(d => d.cross_level.value);

            this.charts.parameters.data.labels = labels;
            this.charts.parameters.data.datasets[0].data = gaugeData;
            this.charts.parameters.data.datasets[1].data = alignmentData;
            this.charts.parameters.data.datasets[2].data = crossLevelData;
            this.charts.parameters.update('none');
        }
    }

    updateRecordingStatus(status) {
        const statusElement = document.getElementById('recordingStatus');
        if (statusElement) statusElement.textContent = status;
        this.currentData.system_info.recording_status = status.toLowerCase();
    }

    exportData(format) {
        const data = {
            timestamp: new Date().toISOString(),
            system_info: {
                generated_by: this.currentData.branding.company_name,
                website: this.currentData.branding.website,
                version: 'ITMS v2.1'
            },
            current_data: this.currentData,
            history: this.dataHistory
        };

        let content, filename, mimeType;

        switch (format) {
            case 'csv':
                content = this.convertToCSV(data);
                filename = `itms_data_teamaamca_${Date.now()}.csv`;
                mimeType = 'text/csv';
                break;
            case 'xml':
                content = this.convertToXML(data);
                filename = `itms_data_teamaamca_${Date.now()}.xml`;
                mimeType = 'application/xml';
                break;
            case 'database':
                alert(`Database export initiated by ${this.currentData.branding.company_name}.\n\nData will be stored in the central repository.\nContact: ${this.currentData.branding.website}`);
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        const headers = ['Timestamp', 'Chainage', 'Gauge', 'Alignment', 'Unevenness', 'Twist', 'Cross Level', 'Speed'];
        const rows = [
            `# Generated by ${data.system_info.generated_by}`,
            `# Website: ${data.system_info.website}`,
            `# Export Date: ${data.timestamp}`,
            headers.join(',')
        ];
        
        data.history.forEach(record => {
            const row = [
                new Date(record.timestamp).toISOString(),
                record.chainage,
                record.gauge.value,
                record.alignment.value,
                record.unevenness.value,
                record.twist.value,
                record.cross_level.value,
                this.currentData.gps_data.speed
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    convertToXML(data) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<itms_data>
    <export_info>
        <generated_by>${data.system_info.generated_by}</generated_by>
        <website>${data.system_info.website}</website>
        <timestamp>${data.timestamp}</timestamp>
        <version>${data.system_info.version}</version>
    </export_info>
    <current_parameters>
        <gauge value="${data.current_data.track_parameters.gauge.value}" status="${data.current_data.track_parameters.gauge.status}"/>
        <alignment value="${data.current_data.track_parameters.alignment.value}" status="${data.current_data.track_parameters.alignment.status}"/>
        <unevenness value="${data.current_data.track_parameters.unevenness.value}" status="${data.current_data.track_parameters.unevenness.status}"/>
        <twist value="${data.current_data.track_parameters.twist.value}" status="${data.current_data.track_parameters.twist.status}"/>
        <cross_level value="${data.current_data.track_parameters.cross_level.value}" status="${data.current_data.track_parameters.cross_level.status}"/>
    </current_parameters>
    <gps_position>
        <latitude>${data.current_data.gps_data.latitude}</latitude>
        <longitude>${data.current_data.gps_data.longitude}</longitude>
        <altitude>${data.current_data.gps_data.altitude}</altitude>
        <speed>${data.current_data.gps_data.speed}</speed>
        <chainage>${data.current_data.gps_data.chainage}</chainage>
    </gps_position>
</itms_data>`;
    }

    filterAlerts(filter) {
        const alertItems = document.querySelectorAll('.alert-item');
        alertItems.forEach(item => {
            const severity = item.getAttribute('data-severity');
            const statusElement = item.querySelector('.alert-status');
            const status = statusElement ? statusElement.textContent.toLowerCase() : '';
            
            let show = false;
            
            switch (filter) {
                case 'all':
                    show = true;
                    break;
                case 'critical':
                    show = severity === 'critical';
                    break;
                case 'high':
                    show = severity === 'high';
                    break;
                case 'medium':
                    show = severity === 'medium';
                    break;
                case 'acknowledged':
                    show = status.includes('acknowledged');
                    break;
            }
            
            item.style.display = show ? 'flex' : 'none';
        });
    }

    switchDiagram(diagramType) {
        // Update tabs
        document.querySelectorAll('.diagram-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-diagram="${diagramType}"]`);
        if (activeTab) activeTab.classList.add('active');
        
        // Update content
        document.querySelectorAll('.diagram-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        const activeContent = document.getElementById(`${diagramType}-diagram`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.classList.remove('hidden');
        }
    }

    runDiagnostics() {
        const diagnosticsBtn = document.getElementById('runDiagnostics');
        if (!diagnosticsBtn) return;
        
        const originalText = diagnosticsBtn.textContent;
        
        diagnosticsBtn.textContent = 'Running Diagnostics...';
        diagnosticsBtn.disabled = true;
        
        // Simulate diagnostic process
        setTimeout(() => {
            alert(`System Diagnostics Complete - ${this.currentData.branding.company_name} ITMS\n\n✓ All sensors operational\n✓ Data acquisition normal\n✓ Communication stable\n✓ Storage capacity OK\n\nNo issues detected.\n\nFor support visit: ${this.currentData.branding.website}`);
            
            diagnosticsBtn.textContent = originalText;
            diagnosticsBtn.disabled = false;
        }, 2000);
    }

    generateReport() {
        alert(`Generating comprehensive track analysis report...\n\nReport by: ${this.currentData.branding.company_name}\nSystem: ITMS Dashboard v2.1\nWebsite: ${this.currentData.branding.website}\n\nReport will be available in the Downloads section.`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ITMS Dashboard...');
    new ITMSApplication();
});

// Add console branding
console.log(`
╔══════════════════════════════════════════╗
║           ITMS Dashboard v2.1            ║
║        Made by Team AAMCA                ║
║        www.teamaamca.ai                  ║
║                                          ║
║    Integrated Track Monitoring System   ║
║      Railway Solutions Provider          ║
╚══════════════════════════════════════════╝
`);