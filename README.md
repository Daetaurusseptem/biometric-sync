<h2>How It Works</h2>
<h3>Overview of a Simple Three-Node Implementation</h3>
<ul>
    <li>
        <h4>Biometric Node</h4>
        <p>This node captures all attendance data throughout the day and stores it for processing.</p>
    </li>
    <li>
        <h4>Scripting Nodes</h4>
        <p>These scripts facilitate connectivity through a local network to a web API:</p>
        <ul>
            <li>
                <h5>Attendance Synchronizer</h5>
                <p>This script gathers all attendance records over a specified period, such as 24 hours, sends this data to an API endpoint for processing, and stores it in a database.</p>
            </li>
            <li>
                <h5>New Employee Synchronizer</h5>
                <p>This manual script synchronizes new users by integrating them into the database via the API each time a new user is registered. It must be run manually whenever a new employee is added.</p>
            </li>
        </ul>
    </li>
    <li>
        <h4>API Features</h4>
        <ul>
            <li>
                <h5>Basic CRUD Operations</h5>
                <p>Enables basic actions on established system models, facilitating data management.</p>
            </li>
            <li>
                <h5>Useful Endpoints</h5>
                <p>These endpoints enhance the API's functionality, supporting various integrations and data flows.</p>
            </li>
        </ul>
    </li>
    <li>
        <h4>Web Application</h4>
        <p>A user interface that allows for interaction with and management of the system's functions.</p>
    </li>
</ul>


![img](https://github.com/Daetaurusseptem/biometric-integration/assets/78524937/bb296378-8d17-463d-8a69-a0e531ae93c8)
