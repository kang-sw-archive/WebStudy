#include <ctime>
#include <iostream>
#include <string>
#include <boost/asio.hpp>

using boost::asio::ip::tcp;
using namespace std;

// 현재 컴퓨터의 날짜 및 시간 정보를 반환합니다.
std::string make_daytime_string()
{
    time_t now = time( 0 );
    return ctime( &now );
}

int main()
{
    try
    {
        // 기본적으로 Boost Asio 프로그램은 하나의 IO Service 객체를 가집니다.
        boost::asio::io_service io_service;

        // TCP 프로토콜의 13번 포트로 연결을 받는 수동 소켓을 생성합니다.
        tcp::acceptor acceptor( io_service, tcp::endpoint( tcp::v4(), 3441 ) );

        // 모든 클라이언트에 대해 무한정 반복 수행합니다. 
        for ( ;; ) 
        {
            // 소켓 객체를 생성해 연결을 기다립니다. 
            tcp::socket socket( io_service ); 
            acceptor.accept( socket ); 
            // 연결이 완료되면 해당 클라이언트에게 보낼 메시지를 생성합니다. 
            string message = make_daytime_string(); 

            auto addr = socket.remote_endpoint().address();
            cout << ( "New connection accomplished " +  addr.to_string() + "\n" );
            // 해당 클라이언트에게 메시지를 담아 전송합니다. 
            boost::system::error_code ignored_error; 
            boost::asio::write( socket, boost::asio::buffer( message ), ignored_error ); 
        }
    }

    catch ( exception& e ) 
    {
        cerr << e.what() << '\n';
    }

    return 0;
} 