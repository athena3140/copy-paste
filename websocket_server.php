<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

require 'vendor/autoload.php';


class MyWebSocketServer implements \Ratchet\MessageComponentInterface
{
    protected $clients;

    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
    }

    public function onOpen(\Ratchet\ConnectionInterface $conn)
    {
      
        $this->clients->attach($conn);
    }

    public function onMessage(\Ratchet\ConnectionInterface $from, $msg)
    {
      
        $messageData = json_decode($msg, true);
        if ($messageData['action'] === 'entry_created') {
         $message = json_encode(['action' => 'reload_entries']);
         foreach ($this->clients as $client) {
            $client->send($message);
         }
      }
        
    }

    public function onClose(\Ratchet\ConnectionInterface $conn)
    {
      
        $this->clients->detach($conn);
    }

    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $e)
    {
      
        echo "An error occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}


$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new MyWebSocketServer()
        )
    ),
    8000
);
$server->run();
