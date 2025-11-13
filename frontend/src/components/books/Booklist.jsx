import { useEffect, useState, React, useRef } from "react";
import { Link } from "react-router-dom";

import "../../styles/style.scss";

import Header from "../common/Header";
import Book from "./Book";
import CustomSelect from "../common/CustomSelect";

import BookService from "../../services/book.service";

/**
 *
 * @returns {React.Component} Book list component
 */

const BookList = () => {
  
  // State for books list
  const [books, setBooks] = useState();

  // Count of books
  const [booksCount, setBooksCount] = useState();

  // Pagination variables
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  
  // Search text in the searchbox
  const [search, setSearch] = useState("");

  // Dropdown filter for status of the book
  const [category, setCategory] = useState("available");
  
  const pageNumbers = [];

  // Used for using the function in child component
  const childRef = useRef(null);

  useEffect(() => {
    getBooks();
  }, [page, rowsPerPage, search, category]);
  
  // Calls the function in header component
  const handleCallChildFunction = () => {
    if (childRef.current) {
      childRef.current.changeCartCount();
    }
  };

  /**
   * Getting books based on pagination
   * @param {Number} currPage 
   * @param {Number} currLimit 
   */
  const getBooks = async () => {
    const filters = {page,rowsPerPage,search,category};
    const response = await BookService.getBooks(filters);
    setBooks(response.data.books);
    setBooksCount(response.data.booksCount);
  };

  // Set page numbers for number of buttons
  for (let i = 1; i <= Math.ceil(booksCount / rowsPerPage); i++) {
    pageNumbers.push(i);
  }

  /**
   * When previous button is clicked
   */
  const handlePrevious = () => {
    if (page !== 1) setPage(page - 1);
  };

  /**
   * When next button is clicked
   */
  const handleNext = () => {
    if (page !== Math.ceil(booksCount / rowsPerPage))
      setPage(page + 1);
  };

  // Function to set different backgrounds in books list and login page
  const setBackground = () => {
    const body = document.querySelector("body");
    body.style.background = "#f7f7f7";
  };

  setBackground();

  /**
   * Function to manage search box
   * @param {Event} e
   */
  const searchBook = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  /**
   * Handles the filter option for status of book
   * @param {Event} e
   */
  const handleFilter = (e) => {
    if(e.target.value==1){
      setCategory("available");
    } else if(e.target.value==2) {
      setCategory("sold");
    } else {
      setCategory("");
    }
    setPage(1);
  };

  /**
   * Sends API call at backend for number of rows per page
   * @param {Number} e
   */
  const handlePageSize = (e) => {
    setRowsPerPage(e.target.value);
    setPage(1);
  };

  /**
   * Sends API call at backend for page number of data
   * @param {Number} number
   */
  const paginate = (number) => {
    setPage(number);
  };

  return (
    <>
      <Header ref={childRef}></Header>
      <div className="container bookList">
        <div className="table-heading">
          <div className="left-heading">
            <h3 className="my-3 heading">Books</h3>
          </div>
          <div className="right-heading">
            <Link to="/addBook" className="mx-2">
              <button className="btn btnAdd">Donate a Book</button>
            </Link>
            <Link to="/books/requestBook">
              <button className="btn btnAdd">Request a Book</button>
            </Link>
          </div>
        </div>
        <div className="components">
          <input
            type="text"
            className="searchBar"
            placeholder="Search here..."
            onChange={searchBook}
          />
          <CustomSelect
            options={[
              { label: "Available", value: "available" },
              { label: "All Status", value: "" },
              { label: "Sold", value: "sold" }
            ]}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by Status"
          />
        </div>
        <div className="booksTable">
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Author</th>
                <th scope="col">Price</th>
                <th scope="col">Sale Price</th>
                <th scope="col">Donated By</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {
                books?.length > 0 ? books?.map((book) => {
                  return <Book book={book} key={book.title} handleCallChildFunction = {handleCallChildFunction} />;
                }) : <tr>
                  <td colSpan="7" className="text-center">No books found</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <div className="left-pagination">
            <span htmlFor="rowsPerPage">Rows per page:</span>
            <CustomSelect
              options={[
                { label: "5", value: "5" },
                { label: "10", value: "10" },
                { label: "15", value: "15" }
              ]}
              value={rowsPerPage.toString()}
              onChange={(e) => {
                handlePageSize({ target: { value: e.target.value } });
              }}
              placeholder="Select rows"
            />
          </div>
          <div className="right-pagination">
            <button
              className="btn btnPaginationControls previous"
              onClick={() => handlePrevious()}
            >
              {" "}
              Previous{" "}
            </button>
            <ul className="">
              {pageNumbers.map((number) => {
                let btnClass = " btn btnPaginationInactive mx-1";
                if (number === page) btnClass = "btn btnPaginationActive mx-1";
                return (
                  <button
                    className={btnClass}
                    onClick={() => paginate(number)}
                    key={number}
                  >
                    {number}
                  </button>
                );
              })}
            </ul>
            <button
              className="btn btnPaginationControls float-right"
              onClick={() => handleNext()}
            >
              {" "}
              Next{" "}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookList;
