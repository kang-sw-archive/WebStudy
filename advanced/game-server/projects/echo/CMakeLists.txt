cmake_minimum_required(VERSION 2.8)
project(echo)

aux_source_directory("${CMAKE_CURRENT_SOURCE_DIR}/source" ECHO_SOURCE_CPP)
add_executable(echoexec ${ECHO_SOURCE_CPP})

target_include_directories(echoexec PUBLIC ${Boost_INCLUDE_DIRS})
target_link_directories(echoexec PUBLIC ${Boost_LIBRARY_DIRS})
target_link_libraries(echoexec PUBLIC ${Boost_LIBRARIES})

