<?php
header('Access-Control-Allow-Origin: *');
$conn = new mysqli('localhost', 'root', '', 'clipboard');
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = $_POST['content'];
    $type = $_POST['type'];
    $content = addslashes($content);
    $sql = "INSERT INTO Clipboard (content, type, created_at) VALUES ('$content','$type', NOW())";
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
                'content' => $row['content'],
                'type' => $row['type']
            );
        }
        echo json_encode($clipboardEntries);
    } else {
        $response = array('status' => 'not_found', 'message' => 'No Clipboard entries found');  
        echo json_encode($response);
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    parse_str(file_get_contents("php://input"), $deleteParams);
    $clipboardId = $deleteParams['clipboard_id'] ?? null;
    $type = $deleteParams['type'] ?? null;

    $response = array('status' => 'error', 'message' => 'Invalid request');

    if ($clipboardId !== null) {
        $sql = "DELETE FROM Clipboard WHERE clipboard_id = $clipboardId";
        $messageSuccess = 'Clipboard entry deleted successfully';
        $messageError = 'Failed to delete Clipboard entry';
    } elseif ($type !== null) {
        if ($type === 'data') {
            $sql = "DELETE FROM Clipboard";
            $messageSuccess = 'All entries deleted successfully';
            $messageError = 'Failed to delete all entries';
        } else {
            $sql = "DELETE FROM Clipboard WHERE type = '$type'";
            $messageSuccess = 'All entries of the specified type deleted successfully';
            $messageError = 'Failed to delete entries of the specified type';
        }
    } else {
        $sql = "";
    }

    if (!empty($sql)) {
        if ($conn->query($sql) === TRUE) {
            $response = array('status' => 'success', 'message' => $messageSuccess);
        } else {
            $response = array('status' => 'error', 'message' => $messageError);
        }
    }

    echo json_encode($response);
}

