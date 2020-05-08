cmake_minimum_required(VERSION 3.1)
project(webserver)

# This uses boost library for overall usage
find_package(Boost 1.72)
link_directories(${Boost_LIBRARY_DIRS})

# Subdirectories
add_subdirectory("projects/echo")
