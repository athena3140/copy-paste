<?php
header('Access-Control-Allow-Origin: *');
$conn = new mysqli('localhost', 'root', '', 'clipboard');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = $_POST['content'];
    $content = addslashes($content);
    $sql = "INSERT INTO Clipboard (content, created_at) VALUES ('$content', NOW())";
    if ($conn->query($sql) === TRUE) {
        $response = array('status' => 'success', 'message' => 'Clipboard entry created successfully');
        echo json_encode($response);
    } else {
        $response = array('status' => 'error', 'message' => 'Failed to create Clipboard entry');
        echo json_encode($response);
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT * FROM Clipboard ORDER BY clipboard_id DESC";
    $result = $conn->query($sql);
    $clipboardEntries = array();
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $clipboardEntries[] = array(
                'clipboard_id' => $row['clipboard_id'],
                'content' => $row['content']
            );
        }
        echo json_encode($clipboardEntries);
    } else {
        $response = array('status' => 'not_found', 'message' => 'No Clipboard entries found');
        echo json_encode($response);
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['delete_all']) && $_GET['delete_all'] === 'true') {
        $sql = "DELETE FROM Clipboard";
        if ($conn->query($sql) === TRUE) {
            $response = array('status' => 'success', 'message' => 'All Clipboard entries deleted successfully');
            echo json_encode($response);
        } else {
            $response = array('status' => 'error', 'message' => 'Failed to delete all Clipboard entries');
            echo json_encode($response);
        }
        exit;
    }
    parse_str(file_get_contents("php://input"), $deleteParams);
    $clipboardId = $deleteParams['clipboard_id'];
    $sql = "DELETE FROM Clipboard WHERE clipboard_id = $clipboardId";
    if ($conn->query($sql) === TRUE) {
        $response = array('status' => 'success', 'message' => 'Clipboard entry deleted successfully');
        echo json_encode($response);
    } else {
        $response = array('status' => 'error', 'message' => 'Failed to delete Clipboard entry');
        echo json_encode($response);
    }
}
