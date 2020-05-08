#include <ctime>
#include <iostream>
#include <string>
#include <boost/asio.hpp>

using boost::asio::ip::tcp;
using namespace std;

// ���� ��ǻ���� ��¥ �� �ð� ������ ��ȯ�մϴ�.
std::string make_daytime_string()
{
    time_t now = time( 0 );
    return ctime( &now );
}

int main()
{
    try
    {
        // �⺻������ Boost Asio ���α׷��� �ϳ��� IO Service ��ü�� �����ϴ�.
        boost::asio::io_service io_service;

        // TCP ���������� 13�� ��Ʈ�� ������ �޴� ���� ������ �����մϴ�.
        tcp::acceptor acceptor( io_service, tcp::endpoint( tcp::v4(), 3441 ) );

        // ��� Ŭ���̾�Ʈ�� ���� ������ �ݺ� �����մϴ�. 
        for ( ;; ) 
        {
            // ���� ��ü�� ������ ������ ��ٸ��ϴ�. 
            tcp::socket socket( io_service ); 
            acceptor.accept( socket ); 
            // ������ �Ϸ�Ǹ� �ش� Ŭ���̾�Ʈ���� ���� �޽����� �����մϴ�. 
            string message = make_daytime_string(); 

            auto addr = socket.remote_endpoint().address();
            cout << ( "New connection accomplished " +  addr.to_string() + "\n" );
            // �ش� Ŭ���̾�Ʈ���� �޽����� ��� �����մϴ�. 
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